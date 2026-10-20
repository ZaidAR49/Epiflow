import "server-only";
import type { WorkflowNode, ExecutionLogItem, SSEWorkflowEvent } from "@/types/test-bench";
import type { AnalysisReportOutput } from "@/lib/validation/report";
import { sendTelegramMessage } from "../telegram/bot-client";

export interface StreamEmailPromptParams {
  reportData: AnalysisReportOutput;
  sendEmailPref: boolean;
  isRtl: boolean;
  sendToTelegram: boolean;
  telegramId: number;
  emit: (event: SSEWorkflowEvent) => Promise<void>;
  log: (nodeId: string, level: ExecutionLogItem["level"], message: string) => Promise<void>;
  finishNode: (
    id: string,
    status: WorkflowNode["status"],
    durationMs: number,
    inputJson?: unknown,
    outputJson?: unknown,
    error?: string
  ) => Promise<WorkflowNode>;
}

export async function handleStreamEmailPrompt(params: StreamEmailPromptParams): Promise<void> {
  const {
    reportData,
    sendEmailPref,
    isRtl,
    sendToTelegram,
    telegramId,
    emit,
    log,
    finishNode,
  } = params;

  // 19. Send Email ?
  await finishNode("node_check_send_email_pref", "completed", 2, { sendEmail: sendEmailPref }, { proceed: sendEmailPref });

  if (!sendEmailPref) {
    await finishNode("node_check_hr_email", "skipped", 0, { hrEmail: null }, { skipped: true, reason: "sendEmail is false" });
    await finishNode("node_ask_draft_email", "skipped", 0, { hrEmail: null }, { skipped: true, reason: "sendEmail is false" });
    await log("node_check_send_email_pref", "warn", "Email drafting feature is disabled for this user profile");

    const disabledNotice = isRtl
      ? "ℹ️ ميزة إنشاء مسودة البريد الإلكتروني غير مفعّلة لهذا الحساب."
      : "ℹ️ Email drafting feature is disabled for this profile.";

    await emit({
      type: "chat_message",
      message: {
        id: `notice_${Date.now()}`,
        sender: "bot",
        text: disabledNotice,
        timestamp: new Date().toLocaleTimeString(),
      },
    });

    if (sendToTelegram) {
      await sendTelegramMessage(telegramId, disabledNotice, { isRtl });
    }
    return;
  }

  // 20. Check for HR Email
  const hrEmail = reportData.metadata.hrEmail;
  const hasEmail = Boolean(hrEmail);
  await finishNode("node_check_hr_email", "completed", 2, { hrEmail }, { hasEmail });

  if (hasEmail) {
    const promptText = isRtl
      ? "هل ترغب في أن نجهز لك مسودة بريد إلكتروني للتقديم مع سيرتك الذاتية المرفقة؟"
      : "Would you like us to prepare an email draft for your application with your CV attached?";

    await emit({
      type: "chat_message",
      message: {
        id: `prompt_${Date.now()}`,
        sender: "bot",
        text: promptText,
        timestamp: new Date().toLocaleTimeString(),
        replyMarkup: {
          buttons: [
            { text: isRtl ? "نعم، جهز المسودة ✅" : "Yes, Prepare Draft ✅", action: "yes" },
            { text: isRtl ? "لا، شكراً ❌" : "No, Thanks ❌", action: "no" },
          ],
        },
        metadata: {
          role: reportData.metadata.role,
          company: reportData.metadata.company,
          hrName: reportData.metadata.hrName,
          hrEmail: reportData.metadata.hrEmail,
        },
      },
    });

    await emit({
      type: "email_prompt",
      metadata: {
        role: reportData.metadata.role,
        company: reportData.metadata.company,
        hrName: reportData.metadata.hrName,
        hrEmail: reportData.metadata.hrEmail,
      },
    });

    if (sendToTelegram) {
      const metadataJson = JSON.stringify({
        role: reportData.metadata.role,
        company: reportData.metadata.company,
        hr_name: reportData.metadata.hrName,
        hr_email: reportData.metadata.hrEmail,
      });
      const telegramPromptText = isRtl
        ? `هل ترغب في أن نجهز لك مسودة بريد إلكتروني للتقديم؟<a href="https://hidden.data/?meta=${encodeURIComponent(metadataJson)}">&#8203;</a>`
        : `Do you want us to prepare an email draft for your application?<a href="https://hidden.data/?meta=${encodeURIComponent(metadataJson)}">&#8203;</a>`;

      await sendTelegramMessage(telegramId, telegramPromptText, {
        parseMode: "HTML",
        isRtl,
        replyMarkup: {
          inline_keyboard: [
            [
              { text: isRtl ? "نعم ✅" : "Yes ✅", callback_data: "yes" },
              { text: isRtl ? "لا ❌" : "No ❌", callback_data: "no" },
            ],
          ],
        },
      });
    }

    await finishNode("node_ask_draft_email", "completed", 8, { hrEmail }, { promptShown: true });
    await log("node_check_hr_email", "success", `HR application email verified: ${hrEmail}`);
    await log("node_ask_draft_email", "success", "Interactive prompt displayed in chat and Telegram");
  } else {
    const noEmailNotice = isRtl
      ? "ℹ️ **تنبيه:** لم يقم الناشر بتضمين بريد إلكتروني للتواصل أو التقديم المباشر في تفاصيل المنشور."
      : "ℹ️ **Notice:** The author did not include an email address for direct application or contact in the post details.";

    await emit({
      type: "chat_message",
      message: {
        id: `notice_${Date.now()}`,
        sender: "bot",
        text: noEmailNotice,
        timestamp: new Date().toLocaleTimeString(),
      },
    });

    if (sendToTelegram) {
      await sendTelegramMessage(telegramId, noEmailNotice, { isRtl });
    }

    await finishNode("node_ask_draft_email", "skipped", 0, { hrEmail: null }, { skipped: true });
    await log("node_check_hr_email", "warn", "No application email in post body; notice delivered");
  }
}
