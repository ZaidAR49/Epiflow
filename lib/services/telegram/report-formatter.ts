import type { StructuredReport } from "@/lib/validation/report";

interface FormatReportOptions {
  report: StructuredReport;
  language?: "ar" | "en";
  verifiedEmail?: string | null;
}

function cleanValue(
  val: string | null | undefined,
  fallbackText: string
): string {
  if (!val || typeof val !== "string") return fallbackText;
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower === "not specified" ||
    lower === "not available" ||
    lower === "none" ||
    lower === "n/a" ||
    lower === "غير محدد" ||
    trimmed === ""
  ) {
    return fallbackText;
  }
  return trimmed;
}

function formatCompanySize(rawSize: string | null | undefined, isArabic: boolean): string {
  const fallbackText = isArabic ? "غير متوفر" : "Not available";
  const cleaned = cleanValue(rawSize, fallbackText);
  if (cleaned === fallbackText) return fallbackText;

  if (isArabic) {
    if (cleaned.includes("موظف")) return cleaned;
    const withoutEnglish = cleaned.replace(/employees?/gi, "").trim();
    return `${withoutEnglish} موظف`;
  }

  if (cleaned.toLowerCase().includes("employee")) return cleaned;
  return `${cleaned} employees`;
}

/**
 * Constructs the Telegram report matching Section 6.2 of the n8n recruitment intelligence workflow.
 * Spacing (<br>, &nbsp;), divider lines (---), and bullet styles are preserved.
 */
export function formatTelegramReport(options: FormatReportOptions): string {
  const { report, language = "ar", verifiedEmail } = options;
  const isArabic = language === "ar";
  const fallback = isArabic ? "غير متوفر" : "Not available";

  const role = report.role;
  const poster = report.poster;
  const company = report.company;
  const flags = report.flags || [];

  const location = cleanValue(role.location, fallback);
  const jobType = cleanValue(role.jobType, fallback);
  const experience = cleanValue(role.experienceLevel, fallback);

  const lines: string[] = [];

  // Top Title & Meta
  lines.push(`## ${role.title} — ${company.name}`);
  lines.push("---");
  lines.push("<br>");
  lines.push("");

  if (isArabic) {
    lines.push(`**📍 الموقع:** ${location} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; **💼 نوع العمل:** ${jobType} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; **⏳ الخبرة:** ${experience}`);
  } else {
    lines.push(`**📍 Location:** ${location} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; **💼 Job Type:** ${jobType} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; **⏳ Experience:** ${experience}`);
  }

  lines.push("<br>");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Section 1: Opportunity Details
  lines.push(isArabic ? "### 🎯 تفاصيل الفرصة الوظيفية" : "### 🎯 Opportunity Details");
  lines.push("");
  lines.push(isArabic ? "####ملخص الدور الوظيفي:" : "####Role Summary:");
  lines.push("<br>");
  lines.push(role.summary || fallback);
  lines.push("&nbsp;");
  lines.push("");

  lines.push(isArabic ? "####المسؤوليات الرئيسية:" : "####Key Responsibilities:");
  if (role.responsibilities && role.responsibilities.length > 0) {
    for (const item of role.responsibilities) {
      lines.push(`* ${item}`);
    }
  } else {
    lines.push(`* ${fallback}`);
  }
  lines.push("&nbsp;");
  lines.push("");

  lines.push(isArabic ? "####المتطلبات:" : "####Requirements:");
  if (role.requirements && role.requirements.length > 0) {
    for (const item of role.requirements) {
      lines.push(`* ${item}`);
    }
  } else {
    lines.push(`* ${fallback}`);
  }

  if (role.preferredSkills && role.preferredSkills.length > 0) {
    const prefLabel = isArabic ? "المهارات المفضلة:" : "Preferred Skills:";
    lines.push(`* **${prefLabel}** ${role.preferredSkills.join(", ")}`);
  } else {
    const prefLabel = isArabic ? "المهارات المفضلة:" : "Preferred Skills:";
    lines.push(`* **${prefLabel}** ${fallback}`);
  }
  lines.push("&nbsp;");
  lines.push("");

  const baseApply = cleanValue(
    role.howToApply,
    isArabic ? "يرجى التقديم عبر رابط المنشور الأصلي" : "Apply via LinkedIn post"
  );
  if (verifiedEmail) {
    const applyPrefix = isArabic ? "####كيفية التقديم: يرجى إرسال السيرة الذاتية إلى" : "####How to Apply: Please send your CV to";
    lines.push(`${applyPrefix} \`${verifiedEmail}\``);
  } else {
    const applyLabel = isArabic ? "####كيفية التقديم:" : "####How to Apply:";
    lines.push(`${applyLabel} ${baseApply}`);
  }

  lines.push("<br>");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Section 2: Poster Details
  lines.push(isArabic ? "### 👤 ناشر الإعلان (الموارد البشرية/التوظيف)" : "### 👤 Poster");
  lines.push("");
  if (poster.isCompanyPost || !poster.name) {
    lines.push(
      isArabic
        ? "غير متوفر - تم النشر بواسطة الشركة مباشرة."
        : "Not applicable — posted directly by the company."
    );
  } else {
    lines.push(`* **${isArabic ? "الاسم:" : "Name:"}** ${poster.name}`);
    lines.push(`* **${isArabic ? "المسمى الوظيفي:" : "Job Title:"}** ${cleanValue(poster.title, fallback)}`);
    lines.push(`* **${isArabic ? "الموقع:" : "Location:"}** ${cleanValue(poster.location, fallback)}`);
    lines.push(`* **${isArabic ? "التعليم:" : "Education:"}** ${cleanValue(poster.education, fallback)}`);
    lines.push(`* **${isArabic ? "الخبرة والسيرة الذاتية:" : "Experience & Bio:"}** ${cleanValue(poster.experienceSummary, fallback)}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  // Section 3: About Company
  lines.push(isArabic ? "### 🏢 عن الشركة" : "### 🏢 About the Company");
  lines.push("");
  lines.push(`* **${isArabic ? "الاسم:" : "Name:"}** ${company.name}`);
  lines.push(`* **${isArabic ? "الصناعة:" : "Industry:"}** ${cleanValue(company.industry, fallback)}`);
  lines.push(`* **${isArabic ? "حجم الشركة:" : "Company Size:"}** ${formatCompanySize(company.size, isArabic)}`);
  lines.push(`* **${isArabic ? "التواجد الجغرافي:" : "Geographic Presence:"}** ${cleanValue(company.geographicPresence, fallback)}`);
  if (company.website && company.website !== fallback) {
    lines.push(`* **${isArabic ? "الموقع الإلكتروني:" : "Website:"}** [${company.website}](${company.website})`);
  } else {
    lines.push(`* **${isArabic ? "الموقع الإلكتروني:" : "Website:"}** ${fallback}`);
  }
  lines.push(`* **${isArabic ? "السيرة الذاتية:" : "Bio:"}** ${cleanValue(company.bio, fallback)}`);

  lines.push("<br>");
  lines.push("");
  lines.push("---");

  // Section 4: Flags & Quick Insights
  lines.push(isArabic ? "### 💡 ملاحظات سريعة وتحليلات" : "### 💡 Quick Notes & Analysis");
  lines.push("");
  if (flags.length === 0) {
    lines.push(
      isArabic
        ? "* ℹ️ **حقول مفقودة:** لم يتم تسجيل أي ملاحظات أو تحذيرات إضافية."
        : "* ℹ️ **Missing fields:** No special flags recorded."
    );
  } else {
    for (let i = 0; i < flags.length; i++) {
      const flag = flags[i];
      if (!flag) continue;
      const icon = flag.type === "warning" ? "⚠️" : "ℹ️";
      lines.push(`* ${icon} **${flag.label}:** ${flag.observation}`);
      if (i < flags.length - 1) {
        lines.push("<br>");
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}
