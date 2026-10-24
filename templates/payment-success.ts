import { renderBaseEmail, escapeHtml } from "./base";
import type { RenderedEmail, PaymentSuccessEmailProps } from "./types";

export function buildPaymentSuccessEmail(props: PaymentSuccessEmailProps): RenderedEmail {
  const isAr = props.locale === "ar";
  const safeName = escapeHtml(props.recipientName || (isAr ? "عميلنا الكريم" : "valued customer"));
  const safePlan = escapeHtml(props.planName);
  const safeAmount = escapeHtml(props.amountFormatted);
  const dashboardUrl = props.dashboardUrl || "https://epiflow.io/dashboard";

  const defaultSubject = isAr
    ? `تم تأكيد الدفع بنجاح — خطة ${safePlan} مفعّلة الآن`
    : `Payment confirmed — Your ${safePlan} is now active`;

  const subject = props.subject || defaultSubject;

  const title = isAr
    ? `شكراً لك، ${safeName}!`
    : `Thank you, ${safeName}!`;

  const subtitle = isAr
    ? `تم استلام دفعتك بنجاح وترقية حسابك إلى خطة ${safePlan}.`
    : `Your payment was processed successfully, and your account has been updated.`;

  const bodyHtml = isAr
    ? `
      <p style="margin: 0 0 16px 0;">
        تمت معالجة دفعتك وتحديث صلاحيات حسابك فوراً. يمكنك الآن الاستفادة من ميزات خطتك الجديدة وفحص منشورات التوظيف بالسرعة والأولوية القصوى.
      </p>
    `.trim()
    : `
      <p style="margin: 0 0 16px 0;">
        We've successfully received your payment. Your new quota and capabilities are active immediately on your EpiFlow workspace.
      </p>
    `.trim();

  const bodyText = isAr
    ? `تم استلام دفعتك بنجاح لخطة ${safePlan} بمبلغ ${safeAmount}. حسابك مفعل وجاهز الآن في لوحة التحكم.`
    : `Your payment of ${safeAmount} for ${safePlan} was confirmed. Your updated plan is now active on your dashboard.`;

  const items = [
    { label: isAr ? "الخطة / الباقة" : "Plan / Product", value: safePlan },
    { label: isAr ? "المبلغ المدفوع" : "Amount Paid", value: safeAmount },
    ...(props.invoiceId ? [{ label: isAr ? "رقم الفاتورة" : "Invoice ID", value: props.invoiceId, isMono: true }] : []),
    ...(props.quotaGranted ? [{ label: isAr ? "الرصيد المتاح" : "Quota / Scans", value: props.quotaGranted }] : []),
    ...(props.transactionDate ? [{ label: isAr ? "تاريخ المعاملة" : "Transaction Date", value: props.transactionDate }] : []),
    ...(props.nextRenewalDate ? [{ label: isAr ? "التجديد القادم" : "Next Renewal", value: props.nextRenewalDate }] : []),
  ];

  return renderBaseEmail(
    {
      locale: props.locale,
      previewText: isAr
        ? `تم تأكيد دفعتك لخطة ${safePlan} بمبلغ ${safeAmount}.`
        : `Your payment of ${safeAmount} for ${safePlan} is confirmed.`,
      badge: {
        text: isAr ? "تم الدفع بنجاح" : "PAYMENT CONFIRMED",
        variant: "success",
      },
      subject,
      title,
      subtitle,
      button: {
        label: isAr ? "لوحة التحكم" : "Go to Dashboard",
        url: dashboardUrl,
        variant: "primary",
      },
      secondaryButton: props.receiptUrl
        ? {
            label: isAr ? "تحميل الفاتورة" : "View Invoice",
            url: props.receiptUrl,
            variant: "secondary",
          }
        : undefined,
      items,
      footerNote: isAr
        ? "تظهر هذه المعاملة في كشف حسابك البنكي تحت اسم EpiFlow. يمكنك إدارة اشتراكك وفواتيرك في أي وقت عبر الإعدادات."
        : "This charge will appear on your statement as EpiFlow. You can manage your subscription and download invoices anytime in Settings.",
    },
    bodyHtml,
    bodyText
  );
}
