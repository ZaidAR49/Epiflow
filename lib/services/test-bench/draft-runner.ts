import "server-only";
import { executeDraftCreation } from "../email/compose-draft";
import { authenticateGatekeeper } from "@/lib/db/queries/access";
import {
  getWorkflowDecryptedRefreshToken,
  touchWorkflowCredential,
} from "@/lib/db/queries/credentials";
import { isOk } from "@/lib/result";
import { sendTelegramMessage } from "../telegram/bot-client";
import type { WorkflowNode, ExecutionLogItem } from "@/types/test-bench";

export interface ExecuteDraftBranchParams {
  telegramId?: number;
  userId?: string;
  role: string;
  company: string;
  hrName?: string | null;
  hrEmail: string;
}

export interface DraftBranchResult {
  nodes: WorkflowNode[];
  logs: ExecutionLogItem[];
  draftUrl?: string;
  error?: string;
}

export async function executeTestBenchDraftBranch(
  params: ExecuteDraftBranchParams
): Promise<DraftBranchResult> {
  const telegramId = params.telegramId ?? 2076665816;
  const logs: ExecutionLogItem[] = [];

  function log(nodeId: string, level: ExecutionLogItem["level"], message: string) {
    logs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      nodeId,
      message,
    });
  }

  // 1. Fetch user CV link & preferences
  const auth = await authenticateGatekeeper(telegramId, "job-xray");
  const cvUrl = auth.cvUrl;
  const fullName = auth.fullName || auth.firstName || "Applicant";

  const downloadNode: WorkflowNode = {
    id: "node_download_cv",
    name: "Download file",
    category: "email",
    n8nType: "n8n-nodes-base.googleDrive",
    description: "Downloads user CV document from configured Google Drive link",
    status: "running",
  };

  const draftNode: WorkflowNode = {
    id: "node_create_gmail_draft",
    name: "Create Gmail Draft",
    category: "email",
    n8nType: "n8n-nodes-base.gmail",
    description: "Composes RFC 2822 MIME message and creates Gmail draft with CV attached",
    status: "idle",
  };

  const noticeNode: WorkflowNode = {
    id: "node_draft_ready_notice",
    name: "Telegram: Draft Ready Notice",
    category: "delivery",
    n8nType: "n8n-nodes-base.telegram",
    description: "Sends confirmed draft URL link allowing user to inspect and send draft in Gmail",
    status: "idle",
  };

  // 1b. Check if sendEmail feature is enabled for user
  if (!auth.sendEmail) {
    const errorMsg = "Email drafting is disabled for this profile (sendEmail is false in user metadata)";
    log("node_download_cv", "warn", errorMsg);
    downloadNode.status = "skipped";
    draftNode.status = "skipped";
    noticeNode.status = "skipped";
    return {
      nodes: [downloadNode, draftNode, noticeNode],
      logs,
      error: errorMsg,
    };
  }

  const t0 = Date.now();
  log("node_download_cv", "info", `Fetching CV from Google Drive URL: ${cvUrl ?? "none"}`);

  // Resolve user-specific Google credential or fallback
  const targetUserId = params.userId ?? auth.userId;
  let userRefreshToken: string | null = null;
  if (targetUserId) {
    try {
      userRefreshToken = await getWorkflowDecryptedRefreshToken(targetUserId, "job-xray", "google");
    } catch {
      // Ignored: Environment fallback will be evaluated
    }
  }

  const effectiveRefreshToken = userRefreshToken || process.env.GOOGLE_REFRESH_TOKEN;
  if (userRefreshToken) {
    log("node_create_gmail_draft", "info", "Using user-authorized Gmail OAuth credentials");
  } else if (process.env.GOOGLE_REFRESH_TOKEN) {
    log("node_create_gmail_draft", "info", "Using environment fallback Gmail credentials");
  } else {
    log("node_create_gmail_draft", "warn", "No user Gmail credential connected and GOOGLE_REFRESH_TOKEN is unset");
  }

  const draftResult = await executeDraftCreation({
    role: params.role,
    company: params.company,
    hrName: params.hrName,
    hrEmail: params.hrEmail,
    fullName,
    cvUrl,
    googleRefreshToken: effectiveRefreshToken,
  });

  const duration = Date.now() - t0;

  if (isOk(draftResult)) {
    const { draftId, draftUrl } = draftResult.data;

    // Update credential last_used_at timestamp if user-specific token was used
    if (targetUserId && userRefreshToken) {
      void touchWorkflowCredential(targetUserId, "job-xray", "google").catch(() => {});
    }

    downloadNode.status = "completed";
    downloadNode.durationMs = Math.round(duration * 0.4);
    downloadNode.inputJson = { cvUrl };
    downloadNode.outputJson = { downloaded: true, target: "Google Drive" };
    log("node_download_cv", "success", "CV file downloaded successfully");

    draftNode.status = "completed";
    draftNode.durationMs = Math.round(duration * 0.5);
    draftNode.inputJson = {
      to: params.hrEmail,
      subject: `Application for ${params.role} - ${fullName}`,
      attachment: "CV attached",
    };
    draftNode.outputJson = { draftId, draftUrl };
    log("node_create_gmail_draft", "success", `Gmail draft created successfully: ID ${draftId}`);

    noticeNode.status = "completed";
    noticeNode.durationMs = 15;
    noticeNode.inputJson = { draftUrl };
    noticeNode.outputJson = { delivered: true, draftUrl };

    const isRtl = (auth.preferredLanguage ?? "ar") === "ar";
    const readyNotice = isRtl
      ? `✅ **تم تجهيز مسودة البريد الإلكتروني بنجاح!**\n\nيمكنك مراجعتها وتعديلها عبر الرابط التالي:\n[فتح المسودة في Gmail](${draftUrl})`
      : `✅ **Email draft is ready!**\n\nYou can review, edit, and send it via the link below:\n[Open Draft in Gmail](${draftUrl})`;

    await sendTelegramMessage(telegramId, readyNotice, { isRtl });
    log("node_draft_ready_notice", "success", `Draft ready notice delivered to Telegram user ${telegramId}: ${draftUrl}`);

    return {
      nodes: [downloadNode, draftNode, noticeNode],
      logs,
      draftUrl,
    };
  }

  downloadNode.status = "failed";
  draftNode.status = "failed";
  draftNode.error = draftResult.error.safeMessage;
  log("node_create_gmail_draft", "error", `Draft creation failed: ${draftResult.error.safeMessage}`);

  return {
    nodes: [downloadNode, draftNode, noticeNode],
    logs,
    error: draftResult.error.safeMessage,
  };
}
