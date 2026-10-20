/**
 * Telegram message formatting helpers.
 * Escapes characters for MarkdownV2 or standard Markdown safely.
 */

export function escapeMarkdownV2(text: string): string {
  // Characters that must be escaped in Telegram MarkdownV2:
  // _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

/**
 * Strips HTML tags cleanly for plain-text fallbacks.
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Converts Markdown / text into Telegram-compliant HTML.
 * - Converts headings to <b>...</b>
 * - Converts divider lines to visual separators
 * - Converts bullet lists to unicode bullets (prevents entity errors)
 * - Converts bold and italic syntax to HTML tags
 * - Wraps inline code with <code>...</code> and isolates LTR in Arabic
 * - Injects Right-To-Left Mark (\u200F) when text is Arabic
 */
export function markdownToTelegramHtml(
  text: string,
  options?: { isRtl?: boolean }
): string {
  if (!text) return "";

  const isArabic =
    options?.isRtl !== undefined
      ? options.isRtl
      : /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);

  let formatted = text.replace(/\r\n/g, "\n");

  // 1. Normalize line breaks and spacing from AI/n8n templates
  formatted = formatted.replace(/<br\s*\/?>/gi, "\n");
  formatted = formatted.replace(/&nbsp;/gi, " ");

  // 2. Temporarily protect valid Telegram HTML tags
  const protectedTags: string[] = [];
  formatted = formatted.replace(
    /<(a\s+href="[^"]*"|b|i|code|pre|u|s|blockquote)(?:\s+expandable)?>[\s\S]*?<\/\1>|<a\s+href="[^"]*">&#8203;<\/a>/gi,
    (match) => {
      const idx = protectedTags.length;
      protectedTags.push(match);
      return `___TG_TAG_${idx}___`;
    }
  );

  // 3. Escape raw HTML entities in surrounding text
  formatted = formatted
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 4. Restore protected tags
  formatted = formatted.replace(/___TG_TAG_(\d+)___/g, (_, idx) => {
    return protectedTags[Number(idx)] ?? "";
  });

  // 5. Code blocks (```...```)
  formatted = formatted.replace(/```(?:[a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g, (_, code) => {
    return `<pre>${code.trim()}</pre>`;
  });

  // 6. Inline code (`...`) - isolate LTR in Arabic contexts
  formatted = formatted.replace(/`([^`\n]+)`/g, (_, code) => {
    const trimmed = code.trim();
    if (isArabic) {
      return `\u200E<code>${trimmed}</code>\u200F`;
    }
    return `<code>${trimmed}</code>`;
  });

  // 7. Headers (##, ###, #### with or without trailing space) -> Bold
  formatted = formatted.replace(/^(?:#{1,6})\s*(.+)$/gm, "<b>$1</b>");

  // 8. Horizontal rules (---, ___, ***) -> Clean visual divider line
  formatted = formatted.replace(/^(?:-{3,}|\*{3,}|_{3,})$/gm, "────────────────────");

  // 9. Bullet lists: convert asterisk bullets to clean hyphens matching n8n
  formatted = formatted.replace(/^\*\s+(.+)$/gm, "- $1");

  // 10. Bold (**text** or __text__)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  formatted = formatted.replace(/__(.+?)__/g, "<b>$1</b>");

  // 11. Single asterisk bold/italic (*text* without internal line breaks)
  formatted = formatted.replace(/(?<![*\w])\*([^*\n]+)\*(?![*\w])/g, "<b>$1</b>");

  // 12. Markdown links [text](url)
  formatted = formatted.replace(/\[([^\]]+)\]\(((?:https?:\/\/|www\.)[^\s)]+)\)/g, (_, text, url) => {
    const href = url.startsWith("www.") ? `https://${url}` : url;
    return `<a href="${href}">${text}</a>`;
  });

  // 13. Clean up excessive consecutive blank lines while preserving intentional paragraph breaks
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  // 14. Prepend Right-To-Left Mark (\u200F) on every line for Arabic messages to force strict RTL
  if (isArabic) {
    formatted = formatted
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        if (line.startsWith("\u200F")) return line;
        return "\u200F" + line;
      })
      .join("\n");
  }

  return formatted.slice(0, 4000);
}

export const TelegramMessages = {
  ar: {
    invalidUrl:
      "⚠️ *الرابط غير صالح.*\nيرجى إرسال رابط صحيح لمنشور أو وظيفة على لينكد إن.\n\n*أمثلة:*\n`https://www.linkedin.com/posts/...`\n`https://www.linkedin.com/jobs/view/...`\n`https://lnkd.in/...`",
    validating: "⏳ جارٍ التحقق من الرابط وصلاحية الوصول...",
    scrapingPost: "⏳ جارٍ استخراج تفاصيل المنشور...",
    enriching: "⏳ جارٍ إثراء وتحليل بيانات الناشر والشركة...",
    generating: "⚡ جارٍ توليد تقرير الاستخبارات الذكي...",
    completed: "✅ تم اكتمال التحليل بنجاح!",
    scrapeEmpty: "❌ تعذر استخراج بيانات المنشور. قد يكون المنشور خاصاً أو تم حذفه.",
    failed: "❌ حدث خطأ غير متوقع أثناء المعالجة. يرجى المحاولة مرة أخرى لاحقاً.",
    draftPrompt: "✉️ *تم العثور على بريد التقديم المباشر!*\nهل ترغب في إنشاء مسودة بريد في Gmail مع إرفاق سيرتك الذاتية؟",
    yesDraft: "✉️ نعم، أنشئ مسودة",
    noDraft: "تجاهل",
  },
  en: {
    invalidUrl:
      "⚠️ *Invalid URL.*\nPlease send a valid LinkedIn post, job listing, or lnkd.in short link.\n\n*Examples:*\n`https://www.linkedin.com/posts/...`\n`https://www.linkedin.com/jobs/view/...`\n`https://lnkd.in/...`",
    validating: "⏳ Verifying link and account access...",
    scrapingPost: "⏳ Extracting post details...",
    enriching: "⏳ Enriching recruiter and company insights...",
    generating: "⚡ Synthesizing AI intelligence report...",
    completed: "✅ Analysis complete!",
    scrapeEmpty: "❌ Could not extract post content. The post may be private or removed.",
    failed: "❌ An error occurred during processing. Please try again later.",
    draftPrompt: "✉️ *Direct application email identified!*\nWould you like to prepare a Gmail draft with your CV attached?",
    yesDraft: "✉️ Yes, create draft",
    noDraft: "Dismiss",
  },
} as const;
