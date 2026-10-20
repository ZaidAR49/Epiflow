import { describe, it, expect } from "vitest";
import { escapeMarkdownV2, markdownToTelegramHtml } from "@/lib/services/telegram/formatters";
import { formatTelegramReport } from "@/lib/services/telegram/report-formatter";
import { telegramUpdateSchema } from "@/lib/validation/telegram";
import type { StructuredReport } from "@/lib/validation/report";

describe("Telegram Formatting & Validation", () => {
  it("escapes special MarkdownV2 characters properly", () => {
    const raw = "Hello [World]! How are you (doing)? Price: $5.00 - 10+2=12.";
    const escaped = escapeMarkdownV2(raw);

    expect(escaped).toContain("\\[World\\]");
    expect(escaped).toContain("\\!");
    expect(escaped).toContain("\\(doing\\)");
    expect(escaped).toContain("\\-");
    expect(escaped).toContain("\\+");
    expect(escaped).toContain("\\=");
    expect(escaped).toContain("\\.");
  });

  it("validates incoming standard message update", () => {
    const update = {
      update_id: 123456,
      message: {
        message_id: 99,
        from: {
          id: 2076665816,
          first_name: "Zaid",
          username: "zaidr49",
        },
        chat: {
          id: 2076665816,
          type: "private",
        },
        date: 1700000000,
        text: "https://www.linkedin.com/posts/test-post",
      },
    };

    const parsed = telegramUpdateSchema.safeParse(update);
    expect(parsed.success).toBe(true);
  });

  it("safely accepts and ignores unknown update structures", () => {
    const unknownUpdate = {
      update_id: 123457,
      poll_answer: {
        poll_id: "poll-1",
      },
    };

    const parsed = telegramUpdateSchema.safeParse(unknownUpdate);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.message).toBeUndefined();
    }
  });

  it("converts markdown headings, bold, bullets, and code to valid Telegram HTML", () => {
    const md = [
      "## Software Engineer — Google",
      "---",
      "**📍 Location:** Riyadh | **💼 Job Type:** Full-time",
      "### 🎯 Opportunity Details",
      "* Lead front-end architecture",
      "* Build scalable APIs",
      "Apply here: `careers@google.com`",
      "[Official Site](https://google.com)",
    ].join("\n");

    const html = markdownToTelegramHtml(md, { isRtl: false });

    expect(html).toContain("<b>Software Engineer — Google</b>");
    expect(html).toContain("────────────────────");
    expect(html).toContain("<b>📍 Location:</b> Riyadh | <b>💼 Job Type:</b> Full-time");
    expect(html).toContain("<b>🎯 Opportunity Details</b>");
    expect(html).toContain("- Lead front-end architecture");
    expect(html).toContain("- Build scalable APIs");
    expect(html).toContain("<code>careers@google.com</code>");
    expect(html).toContain('<a href="https://google.com">Official Site</a>');
  });

  it("prepends RLM and isolates LTR code in Arabic messages", () => {
    const arabicMd = "⚠️ **تنبيه:** يرجى إرسال السيرة الذاتية إلى `jobs@riyadh.com` مباشرة.";
    const html = markdownToTelegramHtml(arabicMd, { isRtl: true });

    // Starts with Right-to-Left Mark \u200F
    expect(html.startsWith("\u200F")).toBe(true);
    // Bold is converted
    expect(html).toContain("<b>تنبيه:</b>");
    // Code block is isolated with \u200E (LRM) and \u200F (RLM)
    expect(html).toContain("\u200E<code>jobs@riyadh.com</code>\u200F");
  });

  it("preserves pre-existing valid Telegram HTML tags like metadata anchors", () => {
    const raw = 'هل ترغب في مسودة؟<a href="https://hidden.data/?meta=123">&#8203;</a>';
    const html = markdownToTelegramHtml(raw, { isRtl: true });

    expect(html).toContain('<a href="https://hidden.data/?meta=123">&#8203;</a>');
    expect(html.startsWith("\u200F")).toBe(true);
  });

  it("formats Telegram report matching n8n cloud Arabic layout and labels", () => {
    const sampleReport: StructuredReport = {
      role: {
        title: "AI Engineer",
        company: "SIS Global",
        location: "عمان، الأردن",
        jobType: "دوام كامل",
        experienceLevel: "3-5 سنوات",
        summary: "تبحث شركة SIS Global عن مهندس ذكاء اصطناعي لتطوير نماذج متقدمة.",
        responsibilities: ["تطوير النماذج", "نشر الخدمات"],
        requirements: ["إتقان بايثون", "خبرة في تعلم الآلة"],
        preferredSkills: ["Docker", "Kubernetes"],
        howToApply: "يرجى التقديم عبر رابط المنشور",
      },
      poster: {
        isCompanyPost: false,
        name: "Bayan yousef Khaled",
        title: "HR Officer at NARD POS",
        location: "عمان، الأردن",
        education: "بكالوريوس علوم حاسوب",
        experienceSummary: "7 سنوات خبرة",
      },
      company: {
        name: "SIS Global",
        industry: "Software Development",
        size: "51-200",
        geographicPresence: "الأردن، السعودية",
        website: "www.nardpos.com",
        bio: "شركة متخصصة في حلول التقنية والتجزئة",
      },
      flags: [
        {
          type: "warning",
          label: "منشور منقول",
          observation: "الإعلان منقول وليس من الحساب الرسمي للشركة.",
        },
        {
          type: "info",
          label: "قناة تقديم مباشرة",
          observation: "تم تضمين بريد مباشر لاستقبال السير الذاتية.",
        },
      ],
    };

    const reportMd = formatTelegramReport({
      report: sampleReport,
      language: "ar",
      verifiedEmail: "Meltahawy@sisglobal.net",
    });

    // Exact n8n Section 6.2 Arabic structural headers, dividers, and spacing
    expect(reportMd).toContain("## AI Engineer — SIS Global");
    expect(reportMd).toContain("---");
    expect(reportMd).toContain("<br>");
    expect(reportMd).toContain("&nbsp;");
    expect(reportMd).toContain("**📍 الموقع:** عمان، الأردن");
    expect(reportMd).toContain("**💼 نوع العمل:** دوام كامل");
    expect(reportMd).toContain("**⏳ الخبرة:** 3-5 سنوات");
    expect(reportMd).toContain("### 🎯 تفاصيل الفرصة الوظيفية");
    expect(reportMd).toContain("####ملخص الدور الوظيفي:");
    expect(reportMd).toContain("####المسؤوليات الرئيسية:");
    expect(reportMd).toContain("* تطوير النماذج");
    expect(reportMd).toContain("####المتطلبات:");
    expect(reportMd).toContain("* إتقان بايثون");
    expect(reportMd).toContain("**المهارات المفضلة:** Docker, Kubernetes");
    expect(reportMd).toContain("Meltahawy@sisglobal.net");
    expect(reportMd).toContain("### 👤 ناشر الإعلان (الموارد البشرية/التوظيف)");
    expect(reportMd).toContain("* **الاسم:** Bayan yousef Khaled");
    expect(reportMd).toContain("* **المسمى الوظيفي:** HR Officer at NARD POS");
    expect(reportMd).toContain("* **الخبرة والسيرة الذاتية:** 7 سنوات خبرة");
    expect(reportMd).toContain("### 🏢 عن الشركة");
    expect(reportMd).toContain("* **الاسم:** SIS Global");
    expect(reportMd).toContain("* **الصناعة:** Software Development");
    expect(reportMd).toContain("* **حجم الشركة:** 51-200 موظف");
    expect(reportMd).toContain("* **السيرة الذاتية:** شركة متخصصة في حلول التقنية والتجزئة");
    expect(reportMd).toContain("### 💡 ملاحظات سريعة وتحليلات");
    expect(reportMd).toContain("⚠️ **منشور منقول:**");

    // English labels MUST NOT appear
    expect(reportMd).not.toContain("📍 Location:");
    expect(reportMd).not.toContain("💼 Job Type:");
    expect(reportMd).not.toContain("⏳ Experience:");
    expect(reportMd).not.toContain("🎯 Opportunity Details");
    expect(reportMd).not.toContain("Role Summary:");
    expect(reportMd).not.toContain("Key Responsibilities:");
    expect(reportMd).not.toContain("Requirements:");
    expect(reportMd).not.toContain("How to Apply:");
    expect(reportMd).not.toContain("### 👤 Poster");
    expect(reportMd).not.toContain("### 🏢 About the Company");
    expect(reportMd).not.toContain("### 💡 Quick Notes & Analysis");
  });
});
