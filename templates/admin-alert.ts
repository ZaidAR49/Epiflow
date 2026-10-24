import { renderBaseEmail, escapeHtml } from "./base";
import type { AdminAlertEmailProps, EmailBadgeVariant, RenderedEmail } from "./types";

export function buildAdminAlertEmail(props: AdminAlertEmailProps): RenderedEmail {
  const isAr = props.locale === "ar";
  const safeAdmin = escapeHtml(props.adminName || (isAr ? "مدير النظام" : "Administrator"));
  const safeTitle = escapeHtml(props.eventTitle);
  const safeDesc = escapeHtml(props.description);
  const consoleUrl = props.adminConsoleUrl || "https://epiflow.io/admin";

  const defaultSubject = isAr
    ? `[تنبيه إداري] ${props.eventTitle} — EpiFlow`
    : `[Admin Notice] ${props.eventTitle} — EpiFlow`;

  const subject = props.subject || defaultSubject;

  const badgeVariant: EmailBadgeVariant =
    props.eventType === "security_alert" ? "danger" : props.eventType === "role_change" ? "warning" : "default";

  const badgeText = isAr
    ? props.eventType === "new_admin"
      ? "إضافة مسؤول جديد"
      : props.eventType === "role_change"
        ? "تعديل الصلاحيات"
        : "تنبيه إداري"
    : props.eventType === "new_admin"
      ? "NEW ADMIN ADDED"
      : props.eventType === "role_change"
        ? "ROLE CHANGED"
        : "SECURITY NOTICE";

  const title = isAr
    ? `تنبيه إداري: ${safeTitle}`
    : `Admin Alert: ${safeTitle}`;

  const subtitle = isAr
    ? `مرحباً ${safeAdmin}، تم تسجيل تغيير إداري جديد في مساحة عمل EpiFlow الخاصة بك.`
    : `Hello ${safeAdmin}, an administrative change was registered on your EpiFlow workspace.`;

  const bodyHtml = `
    <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6;">
      ${safeDesc}
    </p>
  `.trim();

  const bodyText = `${safeTitle}: ${safeDesc}`;

  const items = [
    ...(props.targetUserEmail
      ? [{ label: isAr ? "المستخدم المعني" : "Target Account", value: props.targetUserEmail, isMono: true }]
      : []),
    ...(props.targetUserRole
      ? [{ label: isAr ? "الدور الجديد" : "Assigned Role", value: props.targetUserRole }]
      : []),
    ...(props.actorEmail
      ? [
          {
            label: isAr ? "تم بواسطة" : "Authorized By",
            value: props.actorName ? `${props.actorName} (${props.actorEmail})` : props.actorEmail,
          },
        ]
      : []),
    ...(props.timestamp
      ? [{ label: isAr ? "وقت الحدث" : "Event Time", value: props.timestamp }]
      : [{ label: isAr ? "وقت الحدث" : "Event Time", value: new Date().toUTCString() }]),
    ...(props.ipAddress ? [{ label: isAr ? "عنوان IP" : "IP Address", value: props.ipAddress, isMono: true }] : []),
  ];

  return renderBaseEmail(
    {
      locale: props.locale,
      previewText: isAr
        ? `تنبيه إداري: تم تسجيل ${props.eventTitle} في المنصة.`
        : `Admin Notice: ${props.eventTitle} has been performed.`,
      badge: {
        text: badgeText,
        variant: badgeVariant,
      },
      subject,
      title,
      subtitle,
      button: {
        label: isAr ? "لوحة الإدارة وسجل النشاط" : "Review in Admin Console",
        url: consoleUrl,
        variant: "primary",
      },
      items,
      highlightBox: {
        title: isAr ? "ملاحظة أمنية هامة" : "Security Notice",
        content: isAr
          ? "إذا لم تكن أنت أو فريقك المعتمد من قام بإجراء هذا التغيير، يُرجى مراجعة لوحة الإدارة وتحديث مفاتيح الوصول فوراً."
          : "If you or an authorized administrator did not initiate this change, please immediately audit active team members and rotate admin credentials.",
        variant: "warning",
      },
      footerNote: isAr
        ? "يُرسل هذا البريد التلقائي لجميع مسؤولي النظام عند إجراء تعديلات حساسة على صلاحيات الفريق."
        : "This security bulletin is dispatched automatically to workspace administrators upon sensitive access adjustments.",
    },
    bodyHtml,
    bodyText
  );
}
