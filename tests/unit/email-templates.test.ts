import { describe, it, expect } from "vitest";
import {
  buildWelcomeEmail,
  buildPaymentSuccessEmail,
  buildAdminAlertEmail,
  buildContactInquiryEmail,
  escapeHtml,
} from "@/templates";

describe("Email Templates System", () => {
  describe("HTML Escaping Utility", () => {
    it("escapes special HTML characters to prevent XSS injection", () => {
      const malicious = '<script>alert("hacked")</script> & \'test\'';
      const escaped = escapeHtml(malicious);
      expect(escaped).toBe(
        "&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt; &amp; &#039;test&#039;"
      );
      expect(escaped).not.toContain("<script>");
    });
  });

  describe("Welcome Email Template", () => {
    it("renders English welcome email with correct styling tokens and defaults", () => {
      const email = buildWelcomeEmail({
        recipientName: "Sarah Connor",
        recipientEmail: "sarah@example.com",
        quotaCredits: 10,
        locale: "en",
      });

      expect(email.subject).toContain("Welcome to EpiFlow");
      expect(email.html).toContain('dir="ltr"');
      expect(email.html).toContain("Sarah Connor");
      expect(email.html).toContain("10 free analysis credits");
      expect(email.html).toContain("#090D16"); // Obsidian background token
      expect(email.html).toContain("#0F172A"); // Slate surface token
      expect(email.html).toContain("#6366F1"); // Accent color
      expect(email.text).toContain("Sarah Connor");
      expect(email.text).toContain("https://epiflow.io");
    });

    it("renders Arabic welcome email with proper RTL attributes and copy", () => {
      const email = buildWelcomeEmail({
        recipientName: "أحمد منصور",
        recipientEmail: "ahmed@example.com",
        quotaCredits: 5,
        locale: "ar",
      });

      expect(email.subject).toContain("مرحباً بك في EpiFlow");
      expect(email.html).toContain('dir="rtl"');
      expect(email.html).toContain("أحمد منصور");
      expect(email.html).toContain("5 أرصدة فحص مجانية");
      expect(email.html).toContain("Cairo");
      expect(email.text).toContain("أحمد منصور");
    });
  });

  describe("Payment Confirmation Email Template", () => {
    it("renders payment receipt email with transaction breakdown", () => {
      const email = buildPaymentSuccessEmail({
        recipientName: "Karim Zaid",
        recipientEmail: "karim@example.com",
        planName: "Pro Unlimited",
        amountFormatted: "$49.00 USD",
        invoiceId: "INV-2026-9041",
        quotaGranted: "500 Scans / Month",
        receiptUrl: "https://epiflow.io/invoices/inv-9041.pdf",
        locale: "en",
      });

      expect(email.subject).toContain("Pro Unlimited");
      expect(email.html).toContain("PAYMENT CONFIRMED");
      expect(email.html).toContain("$49.00 USD");
      expect(email.html).toContain("INV-2026-9041");
      expect(email.html).toContain("500 Scans / Month");
      expect(email.html).toContain("https://epiflow.io/invoices/inv-9041.pdf");
      expect(email.text).toContain("$49.00 USD");
      expect(email.text).toContain("INV-2026-9041");
    });

    it("renders Arabic payment receipt cleanly in RTL", () => {
      const email = buildPaymentSuccessEmail({
        recipientName: "خالد العتيبي",
        recipientEmail: "khaled@example.com",
        planName: "باقة المحترفين",
        amountFormatted: "180 SAR",
        invoiceId: "INV-AR-882",
        locale: "ar",
      });

      expect(email.subject).toContain("باقة المحترفين");
      expect(email.html).toContain('dir="rtl"');
      expect(email.html).toContain("تم الدفع بنجاح");
      expect(email.html).toContain("180 SAR");
      expect(email.text).toContain("180 SAR");
    });
  });

  describe("Admin Alert Email Template", () => {
    it("renders new admin event notification with security warning box", () => {
      const email = buildAdminAlertEmail({
        adminName: "Super Admin",
        eventType: "new_admin",
        eventTitle: "New Administrator Added",
        description: "User john.doe@enterprise.com was granted admin privileges.",
        actorName: "Operations Lead",
        actorEmail: "ops@epiflow.io",
        targetUserEmail: "john.doe@enterprise.com",
        targetUserRole: "admin",
        locale: "en",
      });

      expect(email.subject).toContain("[Admin Notice]");
      expect(email.html).toContain("NEW ADMIN ADDED");
      expect(email.html).toContain("john.doe@enterprise.com");
      expect(email.html).toContain("ops@epiflow.io");
      expect(email.html).toContain("Security Notice");
      expect(email.text).toContain("john.doe@enterprise.com");
    });

    it("renders security alert in Arabic with danger badge variant", () => {
      const email = buildAdminAlertEmail({
        adminName: "مدير المنصة",
        eventType: "security_alert",
        eventTitle: "محاولة دخول مشبوهة",
        description: "تم رصد محاولات متعددة غير مصرح بها من عنوان IP خارجي.",
        ipAddress: "192.0.2.1",
        locale: "ar",
      });

      expect(email.subject).toContain("[تنبيه إداري]");
      expect(email.html).toContain('dir="rtl"');
      expect(email.html).toContain("192.0.2.1");
      expect(email.text).toContain("192.0.2.1");
    });
  });

  describe("Contact Inquiry Email Template", () => {
    it("renders contact submission with mailto direct reply action", () => {
      const email = buildContactInquiryEmail({
        senderName: "Layla Smith",
        senderEmail: "layla@partner.org",
        category: "partnership",
        subject: "Enterprise API Integration Inquiry",
        message: "We would like to connect your LinkedIn intelligence with our ATS platform.\nLooking forward to hearing from you.",
        submittedAt: "2026-10-24T18:00:00Z",
      });

      expect(email.subject).toBe("[EpiFlow Contact: PARTNERSHIP] Enterprise API Integration Inquiry");
      expect(email.html).toContain("Layla Smith");
      expect(email.html).toContain("layla@partner.org");
      expect(email.html).toContain("PARTNERSHIP");
      expect(email.html).toContain("mailto:layla@partner.org?subject=Re%3A%20Enterprise%20API%20Integration%20Inquiry");
      expect(email.html).toContain("<br/>"); // Line breaks converted
      expect(email.text).toContain("Layla Smith <layla@partner.org>");
    });
  });
});
