import "server-only";
import { getInitialWorkflowNodes } from "./initial-nodes";
import type { WorkflowNode, ExecutionLogItem, SSEWorkflowEvent } from "@/types/test-bench";
import { authenticateGatekeeper } from "@/lib/db/queries/access";
import { expandLinkedInUrl } from "../scraper/url-expander";
import { isOk } from "@/lib/result";
import { LINKEDIN_URL_REGEX } from "@/lib/validation/url";
import { sendTelegramMessage } from "../telegram/bot-client";
import { executeStreamScrapingAndAi } from "./stream-enrichment";

export interface StreamWorkflowParams {
  rawUrl: string;
  telegramId?: number;
  sendToTelegram?: boolean;
  onEvent: (event: SSEWorkflowEvent) => void | Promise<void>;
}

export async function executeStreamWorkflow(params: StreamWorkflowParams): Promise<void> {
  const { rawUrl, onEvent, sendToTelegram = true } = params;
  const telegramId = params.telegramId ?? 2076665816;
  const t0 = Date.now();
  const nodes = getInitialWorkflowNodes();

  const emit = async (event: SSEWorkflowEvent) => {
    try {
      await onEvent(event);
    } catch {
      // Ignore client disconnects
    }
  };

  const log = async (nodeId: string, level: ExecutionLogItem["level"], message: string) => {
    await emit({
      type: "log",
      log: {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        nodeId,
        message,
      },
    });
  };

  const finishNode = async (
    id: string,
    status: WorkflowNode["status"],
    durationMs: number,
    inputJson?: unknown,
    outputJson?: unknown,
    error?: string
  ): Promise<WorkflowNode> => {
    const node = nodes.find((n) => n.id === id) ?? {
      id,
      name: id,
      category: "routing",
      n8nType: "code",
      description: "",
      status,
    };
    node.status = status;
    node.durationMs = durationMs;
    node.inputJson = inputJson;
    node.outputJson = outputJson;
    node.error = error;

    await emit({ type: "node_finish", node });
    return node;
  };

  // 1. Trigger
  await emit({ type: "node_start", nodeId: "node_trigger", inputJson: { rawUrl } });
  await log("node_trigger", "info", `Received input URL: ${rawUrl}`);
  await finishNode("node_trigger", "completed", Date.now() - t0, { rawUrl }, { telegramId, rawUrl });

  // 2. Parse User Input
  const t1 = Date.now();
  await emit({ type: "node_start", nodeId: "node_parse_input" });
  const match = rawUrl.match(LINKEDIN_URL_REGEX);
  if (!match) {
    await finishNode("node_parse_input", "failed", Date.now() - t1, { rawUrl }, { isValid: false }, "Invalid LinkedIn URL");
    await log("node_parse_input", "error", "Regex validation failed: Not a valid LinkedIn URL");
    await emit({
      type: "chat_message",
      message: {
        id: `msg_err_${Date.now()}`,
        sender: "bot",
        text: "⚠️ **الرابط غير صالح.** يرجى إرسال رابط صحيح لمنشور أو وظيفة على لينكد إن.",
        timestamp: new Date().toLocaleTimeString(),
      },
    });
    await emit({ type: "workflow_done", trace: { totalDurationMs: Date.now() - t0, status: "failed" } });
    return;
  }
  await finishNode("node_parse_input", "completed", Date.now() - t1, { rawUrl }, { isValid: true, url: match[0] });
  await log("node_parse_input", "success", "URL validated via regular expression");

  // 3. Authentication Gate
  const t2 = Date.now();
  await emit({ type: "node_start", nodeId: "node_auth_gate" });
  const auth = await authenticateGatekeeper(telegramId, "job-xray");
  await finishNode("node_auth_gate", "completed", Date.now() - t2, { telegramId }, auth);
  await log("node_auth_gate", "info", `Gatekeeper check: authorized=${auth.isAuthorized}, quota=${auth.remainingQuota}`);

  // 4. Is Authenticated?
  const t3 = Date.now();
  await emit({ type: "node_start", nodeId: "node_is_auth" });
  if (!auth.isAuthorized && auth.errorCode !== "QUOTA_EXCEEDED") {
    await finishNode("node_is_auth", "failed", Date.now() - t3, auth, { allowed: false }, `Access Denied: ${auth.errorCode}`);
    await log("node_is_auth", "error", `Gatekeeper blocked user: ${auth.errorCode}`);
    await emit({
      type: "chat_message",
      message: {
        id: `msg_auth_err_${Date.now()}`,
        sender: "bot",
        text: `⚠️ **خطأ في الصلاحيات:** ${auth.errorCode}`,
        timestamp: new Date().toLocaleTimeString(),
      },
    });
    await emit({ type: "workflow_done", trace: { totalDurationMs: Date.now() - t0, status: "failed" } });
    return;
  }
  await finishNode("node_is_auth", "completed", Date.now() - t3, auth, { allowed: true });

  // 5. Switch Router
  await finishNode("node_switch", "completed", 5, { route: "Generate Report" }, { branch: "Generate Report" });

  // 6 & 7. Short URL check & expansion
  const isShort = rawUrl.includes("lnkd.in");
  await finishNode("node_is_short_url", "completed", 2, { url: rawUrl }, { isShort });
  let normalizedUrl = rawUrl;
  if (isShort) {
    const tExp = Date.now();
    await emit({ type: "node_start", nodeId: "node_expand_url" });
    const expandRes = await expandLinkedInUrl(rawUrl);
    if (isOk(expandRes)) {
      normalizedUrl = expandRes.data;
      await finishNode("node_expand_url", "completed", Date.now() - tExp, { rawUrl }, { normalizedUrl });
      await log("node_expand_url", "success", `Short URL expanded to: ${normalizedUrl}`);
    } else {
      await finishNode("node_expand_url", "failed", Date.now() - tExp, { rawUrl }, {}, expandRes.error.safeMessage);
      await emit({ type: "workflow_done", trace: { totalDurationMs: Date.now() - t0, status: "failed" } });
      return;
    }
  } else {
    await finishNode("node_expand_url", "skipped", 0, null, { skipped: true });
  }

  // 8. Send Process Status (Chat + Telegram)
  const isRtl = (auth.preferredLanguage ?? "ar") === "ar";
  const statusChatMsgId = `status_${Date.now()}`;
  const initialStatusText = isRtl
    ? "⏳ **تم استلام الرابط!** جاري الآن جلب بيانات المنشور. قد يستغرق هذا الأمر بضع دقائق..."
    : "⏳ **Link received!** I am currently fetching the post data. This might take a few minutes...";

  await emit({
    type: "chat_message",
    message: {
      id: statusChatMsgId,
      sender: "bot",
      text: initialStatusText,
      timestamp: new Date().toLocaleTimeString(),
    },
  });

  let telegramStatusMessageId: number | null = null;
  if (sendToTelegram) {
    const sendRes = await sendTelegramMessage(telegramId, initialStatusText, { isRtl });
    if (isOk(sendRes)) {
      telegramStatusMessageId = sendRes.data.message_id;
    } else {
      await log("node_send_status", "warn", `Failed to send Telegram status: ${sendRes.error.safeMessage}`);
    }
  }
  await finishNode("node_send_status", "completed", 12, { status: "fetching" }, { delivered: true, telegramMessageId: telegramStatusMessageId });

  // 9 - 21. Run Scraping, Normalization, AI synthesis, and Email check
  const success = await executeStreamScrapingAndAi({
    normalizedUrl,
    telegramId,
    sendToTelegram,
    auth,
    statusChatMsgId,
    telegramStatusMessageId,
    t0,
    emit,
    log,
    finishNode,
  });

  await emit({
    type: "workflow_done",
    trace: { totalDurationMs: Date.now() - t0, status: success ? "completed" : "failed" },
  });
}
