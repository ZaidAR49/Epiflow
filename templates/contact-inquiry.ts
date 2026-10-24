import { renderBaseEmail, escapeHtml } from "./base";
import type { ContactInquiryEmailProps, RenderedEmail } from "./types";

export function buildContactInquiryEmail(props: ContactInquiryEmailProps): RenderedEmail {
  const isAr = props.locale === "ar";
  const safeName = escapeHtml(props.senderName);
  const safeEmail = escapeHtml(props.senderEmail);
  const safeSubject = escapeHtml(props.subject);
  const safeCategory = escapeHtml(props.category.toUpperCase());
  const submittedAt = props.submittedAt || new Date().toUTCString();

  const sanitizedMessage = escapeHtml(props.message).replace(/\n/g, "<br/>");
  const replyHref =
    props.replyUrl || `mailto:${props.senderEmail}?subject=${encodeURIComponent("Re: " + props.subject)}`;

  const emailSubject = `[EpiFlow Contact: ${safeCategory}] ${props.subject}`;

  const title = isAr
    ? `رسالة جديدة من: ${safeName}`
    : `New Message from ${safeName}`;

  const subtitle = isAr
    ? `تم إرسال استفسار جديد عبر نموذج التواصل بموقع EpiFlow.`
    : `A new inquiry was submitted via the EpiFlow Contact Us form.`;

  const bodyHtml = `
    <div style="margin-bottom: 8px; font-weight: 600; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
      ${isAr ? "نص الرسالة:" : "Message Content:"}
    </div>
    <div class="email-box" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-inline-start: 3px solid #6366F1; border-radius: 8px; padding: 18px 20px; font-size: 14px; line-height: 1.7; color: #1E293B; word-break: break-word;">
      ${sanitizedMessage}
    </div>
  `.trim();

  const bodyText = [
    `=== New Contact Message ===`,
    `From: ${props.senderName} <${props.senderEmail}>`,
    `Category: ${props.category}`,
    `Subject: ${props.subject}`,
    `Submitted At: ${submittedAt}`,
    ``,
    `--- Message ---`,
    props.message,
  ].join("\n");

  const items = [
    { label: isAr ? "المرسل" : "Sender Name", value: safeName },
    { label: isAr ? "البريد الإلكتروني" : "Email Address", value: safeEmail, isMono: true },
    { label: isAr ? "الموضوع" : "Subject", value: safeSubject },
    { label: isAr ? "التصنيف" : "Category", value: safeCategory },
    { label: isAr ? "وقت الإرسال" : "Submitted At", value: submittedAt },
  ];

  return renderBaseEmail(
    {
      locale: props.locale,
      previewText: `[${safeCategory}] ${props.subject} — from ${props.senderName}`,
      badge: {
        text: safeCategory,
        variant: "default",
      },
      subject: emailSubject,
      title,
      subtitle,
      button: {
        label: isAr ? `الرد على ${safeName}` : `Reply to ${safeName}`,
        url: replyHref,
        variant: "primary",
      },
      items,
      footerNote: isAr
        ? `هذه الرسالة تم إرسالها من نموذج الاتصال في EpiFlow. الرد المباشر عليها سيصل إلى ${safeEmail}.`
        : `This inquiry was submitted via the EpiFlow Contact Us page. Direct reply will address ${safeEmail}.`,
    },
    bodyHtml,
    bodyText
  );
}
