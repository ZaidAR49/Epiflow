import { renderBaseEmail, escapeHtml } from "./base";
import type { RenderedEmail, WelcomeEmailProps } from "./types";

export function buildWelcomeEmail(props: WelcomeEmailProps): RenderedEmail {
  const isAr = props.locale === "ar";
  const safeName = escapeHtml(props.recipientName || (isAr ? "مستخدمنا العزيز" : "there"));
  const safeCredits = props.quotaCredits ?? 5;
  const dashboardUrl = props.dashboardUrl || "https://epiflow.io/dashboard";
  const telegramUrl = props.telegramBotUrl || "https://t.me/EpiFlowBot";

  const defaultSubject = isAr
    ? `مرحباً بك في EpiFlow — تم تفعيل حسابك بنجاح`
    : `Welcome to EpiFlow — Your account is ready`;

  const subject = props.subject || defaultSubject;

  const title = isAr
    ? `أهلاً بك في EpiFlow، ${safeName}!`
    : `Welcome to EpiFlow, ${safeName}!`;

  const subtitle = isAr
    ? `منصتك الذكية لكشف خفايا إعلانات التوظيف وصياغة المراسلات باحترافية.`
    : `Your intelligent workspace to analyze job postings and automate outreach.`;

  const bodyHtml = isAr
    ? `
      <p style="margin: 0 0 16px 0;">
        يسعدنا انضمامك إلى مجتمع EpiFlow. لقد تم تجهيز حسابك وتخصيص 
        <strong style="color: #6366F1;">${safeCredits} أرصدة فحص مجانية</strong> 
        للبدء فوراً في فحص إعلانات الوظائف وتحديد مسؤولي التوظيف.
      </p>
      <div class="email-box" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px 20px; margin: 18px 0;">
        <div style="font-weight: 700; color: #6366F1; margin-bottom: 8px;">كيف تبدأ في 3 خطوات بسيطة:</div>
        <ol class="email-text" style="margin: 0; padding-inline-start: 20px; line-height: 1.8; color: #334155;">
          <li>انسخ رابط أي منشور وظيفي من LinkedIn والصقه في لوحة التحكم.</li>
          <li>استخرج بيانات مسؤول التوظيف، وتحليل متطلبات الشركة فوراً.</li>
          <li>اربط حسابك ببوت تيليجرام لتنفيذ الفحص مباشرة من هاتفك.</li>
        </ol>
      </div>
    `.trim()
    : `
      <p style="margin: 0 0 16px 0;">
        We're thrilled to have you on board! Your account has been initialized with 
        <strong style="color: #6366F1;">${safeCredits} free analysis credits</strong> 
        so you can start decoding job opportunities immediately.
      </p>
      <div class="email-box" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px 20px; margin: 18px 0;">
        <div style="font-weight: 700; color: #6366F1; margin-bottom: 8px;">Get started in 3 quick steps:</div>
        <ol class="email-text" style="margin: 0; padding-inline-start: 20px; line-height: 1.8; color: #334155;">
          <li>Paste any LinkedIn job post URL directly into your dashboard.</li>
          <li>Uncover the hiring manager, verified contact emails, and strategic company insights.</li>
          <li>Connect our Telegram bot to analyze job opportunities on the go.</li>
        </ol>
      </div>
    `.trim();

  const bodyText = isAr
    ? `أهلاً بك في EpiFlow! تم تجهيز حسابك وتخصيص ${safeCredits} أرصدة فحص مجانية. انسخ رابط المنشور الوظيفي من LinkedIn والصقه في لوحة التحكم لبدء الفحص.`
    : `Welcome to EpiFlow! Your account has been activated with ${safeCredits} complimentary scan credits. Paste any LinkedIn post URL to start uncovering recruiter details.`;

  return renderBaseEmail(
    {
      locale: props.locale,
      previewText: isAr
        ? `حسابك في EpiFlow جاهز مع ${safeCredits} أرصدة مجانية.`
        : `Your EpiFlow account is ready with ${safeCredits} complimentary credits.`,
      badge: {
        text: isAr ? "حساب جديد" : "WELCOME",
        variant: "default",
      },
      subject,
      title,
      subtitle,
      button: {
        label: isAr ? "فتح لوحة التحكم" : "Open Dashboard",
        url: dashboardUrl,
        variant: "primary",
      },
      secondaryButton: {
        label: isAr ? "ربط بوت تيليجرام" : "Connect Telegram Bot",
        url: telegramUrl,
        variant: "secondary",
      },
      items: [
        { label: isAr ? "البريد الإلكتروني" : "Account Email", value: props.recipientEmail, isMono: true },
        { label: isAr ? "الرصيد المبدئي" : "Starting Credits", value: `${safeCredits} ${isAr ? "عمليات فحص" : "Scans"}` },
      ],
      footerNote: isAr
        ? "إذا كانت لديك أي استفسارات، يمكنك الرد على هذه الرسالة أو التواصل مع فريق الدعم."
        : "Need any assistance getting started? Feel free to reply to this email.",
    },
    bodyHtml,
    bodyText
  );
}
