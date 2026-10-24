export type EmailLocale = "en" | "ar";

export interface EmailButton {
  label: string;
  url: string;
  variant?: "primary" | "secondary" | "success" | "danger";
}

export interface EmailKeyValueItem {
  label: string;
  value: string;
  isMono?: boolean;
}

export type EmailBadgeVariant = "default" | "success" | "warning" | "danger" | "neutral";

export interface EmailBadge {
  text: string;
  variant?: EmailBadgeVariant;
}

export interface EmailHighlightBox {
  title?: string;
  content: string;
  variant?: EmailBadgeVariant;
}

export interface BaseEmailOptions {
  locale?: EmailLocale;
  previewText?: string;
  badge?: EmailBadge;
  subject?: string;
  title: string;
  subtitle?: string;
  button?: EmailButton;
  secondaryButton?: EmailButton;
  items?: EmailKeyValueItem[];
  highlightBox?: EmailHighlightBox;
  footerNote?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface WelcomeEmailProps {
  recipientName: string;
  recipientEmail: string;
  locale?: EmailLocale;
  dashboardUrl?: string;
  telegramBotUrl?: string;
  quotaCredits?: number;
  subject?: string;
}

export interface PaymentSuccessEmailProps {
  recipientName: string;
  recipientEmail: string;
  planName: string;
  amountFormatted: string;
  invoiceId?: string;
  transactionDate?: string;
  nextRenewalDate?: string;
  quotaGranted?: string;
  dashboardUrl?: string;
  receiptUrl?: string;
  locale?: EmailLocale;
  subject?: string;
}

export interface AdminAlertEmailProps {
  adminName: string;
  eventType: "new_admin" | "role_change" | "security_alert" | "system_notice";
  eventTitle: string;
  description: string;
  actorName?: string;
  actorEmail?: string;
  targetUserEmail?: string;
  targetUserRole?: string;
  timestamp?: string;
  ipAddress?: string;
  adminConsoleUrl?: string;
  locale?: EmailLocale;
  subject?: string;
}

export interface ContactInquiryEmailProps {
  senderName: string;
  senderEmail: string;
  subject: string;
  category: string;
  message: string;
  submittedAt?: string;
  replyUrl?: string;
  locale?: EmailLocale;
}
