import type { PresetData } from "./types";

export const DEFAULT_PRESET: PresetData = {
  url: "https://lnkd.in/d9x2-acme-backend",
  expandedUrl: "Resolved: linkedin.com/posts/acme-corp_hiring-lead-developer",
  authorMeta: "Author: Sarah Jenkins • VP of Engineering at Acme Corp",
  postHtml: `We are expanding our Core Platform architecture at <span class="text-[var(--text)] font-medium underline decoration-[var(--accent)]/60 underline-offset-4">Acme Corp (240 Employees)</span> and looking for a <span class="px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] font-mono text-xs sm:text-sm">Sr. Backend Engineer (Go / Distributed Systems)</span>.\n\nLocation: Remote (EU/MENA) | Full-time | 5+ Years Experience.\n\nSkip the job board queue and send your resume directly to <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold text-xs sm:text-sm border border-emerald-500/30">careers@acme-corp.com</span> with your GitHub profile.`,
  entitySignal: "Individual HR / VP Poster",
  flagText: "Domain Matches Company",
  flagIsWarning: false,
  email: "careers@acme-corp.com",
  role: "Sr. Backend Engineer",
  metaLine: "Remote (EU/MENA) • Full-Time • 5+ Yrs",
  domainCheck: "Matched",
  industryCheck: "Aligned",
  missingCheck: "None",
  recruiterInitials: "SJ",
  recruiterName: "Sarah Jenkins • VP of Engineering",
  recruiterHeadline: "London, UK • M.Sc. Computer Science",
  recruiterBio: "11+ years total experience. Leads Core Infrastructure at Acme Corp. Verified individual poster with direct engineering hiring authority.",
  tenure: "11 yrs",
  companySize: "201 - 500",
  locations: "United Kingdom, Germany, UAE",
  draftTo: "Sarah Jenkins <careers@acme-corp.com>",
  draftSubject: "Application for Sr. Backend Engineer - Candidate Name",
  draftBody: "Dear Sarah Jenkins, I am writing to express my interest in the Sr. Backend Engineer position. I believe my skills and experience make me a strong candidate for this role, and I am eager to bring my dedication to your team at Acme Corp. Please find my resume attached from Google Drive for your review.",
  commEn: {
    title: "Sr. Backend Engineer — Acme Corp",
    meta: "Location: Remote (EU/MENA)  |  Job Type: Full-Time  |  Experience: 5+ Years",
    summary: "Acme Corp (201–500 employees • UK, Germany, UAE) is hiring a Senior Backend Engineer to scale its Core Platform architecture in Go and distributed systems. Posted by Sarah Jenkins (VP of Engineering).",
    apply: "Apply Directly: careers@acme-corp.com"
  },
  commAr: {
    title: "مهندس برمجيات خلفية أول (Sr. Backend) — شركة Acme Corp",
    meta: "الموقع: عن بُعد (أوروبا والشرق الأوسط)  |  الدوام: كامل  |  الخبرة: +5 سنوات",
    summary: "تعلن شركة Acme Corp (201 - 500 موظف • بريطانيا، ألمانيا، الإمارات) عن حاجتها لمهندس Backend خبير في لغة Go والأنظمة الموزعة. تم النشر بواسطة Sarah Jenkins (نائب رئيس الهندسة).",
    apply: "للتقديم المباشر عبر البريد: careers@acme-corp.com"
  },
  ar: {
    expandedUrl: "تم التحقق: linkedin.com/posts/acme-corp_hiring-lead-developer",
    authorMeta: "الناشر: Sarah Jenkins • نائب رئيس الهندسة في Acme Corp",
    entitySignal: "مسؤول توظيف موثق / نائب رئيس",
    flagText: "النطاق متطابق مع الشركة",
    role: "مهندس خلفية أول (Sr. Backend)",
    metaLine: "عن بُعد (أوروبا والشرق الأوسط) • دوام كامل • +5 سنوات",
    domainCheck: "متطابق",
    industryCheck: "متوافق",
    missingCheck: "لا يوجد",
    recruiterName: "Sarah Jenkins • نائب رئيس الهندسة",
    recruiterHeadline: "لندن، المملكة المتحدة • ماجستير علوم الحاسب",
    recruiterBio: "أكثر من 11 عاماً من الخبرة. تقود البنية التحتية الأساسية في Acme Corp. جهة نشر موثوقة ذات سلطة توظيف هندسي مباشرة.",
    tenure: "11 سنة",
    locations: "المملكة المتحدة، ألمانيا، الإمارات",
    draftSubject: "طلب تقديم لوظيفة مهندس خلفية أول - اسم المتقدم",
    draftBody: "السيدة Sarah Jenkins، أود التعبير عن اهتمامي الشديد بالانضمام لفريقكم في منصب مهندس خلفية أول في شركة Acme Corp. تجدون سيرتي الذاتية مرفقة من Google Drive للاطلاع."
  }
};

export const PRESET_SCENARIOS: Record<string, PresetData> = {
  acme: DEFAULT_PRESET,
  nebula: {
    url: "https://www.linkedin.com/posts/nebula-ai_staff-ml-engineer",
    expandedUrl: "Direct Post URL Verified",
    authorMeta: "Author: Nebula AI Official Company Page (Direct Company Post)",
    postHtml: `Following our Series A expansion at <span class="text-[var(--text)] font-medium underline decoration-[var(--accent)]/60 underline-offset-4">Nebula AI</span>, we are hiring a <span class="px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] font-mono text-xs sm:text-sm">Staff ML Systems &amp; Inference Engineer</span>.\n\nHybrid (Riyadh / Amman) | Full-Time.\n\nTo apply, send your CV and benchmark links directly to <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold text-xs sm:text-sm border border-emerald-500/30">talent@nebula-ai.io</span>.`,
    entitySignal: "Posted Directly by Company",
    flagText: "Author Scrape Skipped (Credit Saved)",
    flagIsWarning: false,
    email: "talent@nebula-ai.io",
    role: "Staff ML Systems Engineer",
    metaLine: "Hybrid (Riyadh / Amman) • Full-Time",
    domainCheck: "Matched",
    industryCheck: "Aligned",
    missingCheck: "None",
    recruiterInitials: "NA",
    recruiterName: "Posted Directly by Company (Nebula AI)",
    recruiterHeadline: "AI Infrastructure • Author Scraper Bypassed Automatically",
    recruiterBio: "When our workflow detects a company_id as the direct author, it automatically bypasses the individual profile scraper to return your report faster.",
    tenure: "N/A",
    companySize: "51 - 200",
    locations: "Saudi Arabia, Jordan",
    draftTo: "Nebula AI Hiring Team <talent@nebula-ai.io>",
    draftSubject: "Application for Staff ML Systems Engineer - Candidate Name",
    draftBody: "Dear Nebula AI Team, I am writing to express my interest in the Staff ML Systems Engineer position. I believe my experience in low-latency inference and distributed GPU workloads makes me a strong fit for Nebula AI. Please find my resume attached from Google Drive.",
    commEn: {
      title: "Staff ML Systems Engineer — Nebula AI",
      meta: "Location: Hybrid (Riyadh / Amman)  |  Job Type: Full-Time  |  Level: Staff",
      summary: "Nebula AI (51–200 employees • Saudi Arabia, Jordan) is hiring a Staff ML Systems Engineer to scale multi-node AI inference infrastructure. Posted directly by Nebula AI.",
      apply: "Apply Directly: talent@nebula-ai.io"
    },
    commAr: {
      title: "مهندس أنظمة ذكاء اصطناعي (Staff ML) — شركة Nebula AI",
      meta: "الموقع: هجين (الرياض / عمّان)  |  الدوام: كامل  |  المستوى: متقدم",
      summary: "تبحث شركة Nebula AI (51 - 200 موظف • السعودية، الأردن) عن مهندس أنظمة تعلم آلي لتطوير البنية التحتية للنماذج اللغوية. منشور مباشر من صفحة الشركة.",
      apply: "للتقديم المباشر عبر البريد: talent@nebula-ai.io"
    },
    ar: {
      expandedUrl: "رابط منشور مباشر تم التحقق منه",
      authorMeta: "الناشر: صفحة شركة Nebula AI الرسمية (نشر مباشر)",
      entitySignal: "نشر مباشر من صفحة الشركة",
      flagText: "تجاوز فحص الناشر الفردي (توفير الرصيد)",
      role: "مهندس أنظمة ذكاء اصطناعي (Staff ML)",
      metaLine: "هجين (الرياض / عمّان) • دوام كامل",
      domainCheck: "متطابق",
      industryCheck: "متوافق",
      missingCheck: "لا يوجد",
      recruiterName: "نشر مباشر بواسطة الشركة (Nebula AI)",
      recruiterHeadline: "بنية تحتية للذكاء الاصطناعي • تم تخطي فحص الملف الشخصي آلياً",
      recruiterBio: "عندما يكتشف مسار العمل أن الناشر هو صفحة شركة، فإنه يتجاوز فحص الملف الفردي تلقائياً لتسريع استخراج التقرير وتوفير رصيدك.",
      tenure: "غير متاح",
      locations: "المملكة العربية السعودية، الأردن",
      draftTo: "فريق التوظيف في Nebula AI <talent@nebula-ai.io>",
      draftSubject: "طلب تقديم لوظيفة مهندس أنظمة ذكاء اصطناعي (Staff ML) - اسم المتقدم",
      draftBody: "فريق عمل Nebula AI الموقر، يسعدني التقدم لشغل منصب مهندس أنظمة تعلم آلي متقدم، وأتطلع لتسخير خبرتي في تسريع الاستدلال والنماذج اللغوية لدعم مشاريعكم. تجدون سيرتي الذاتية مرفقة للاطلاع."
    }
  },
  stealth: {
    url: "https://lnkd.in/mena-fintech-fullstack-role",
    expandedUrl: "Resolved: linkedin.com/posts/external-recruiter_fintech-opening",
    authorMeta: "Author: Tariq Mansour • Talent Acquisition Specialist",
    postHtml: `Hiring a <span class="px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] font-mono text-xs sm:text-sm">Senior Full-Stack Engineer (Node.js / Next.js)</span> for a leading FinTech platform in MENA.\n\nLocation: Dubai / Remote.\n\nTo apply, send your updated CV to <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-semibold text-xs sm:text-sm border border-amber-500/30">tariq.hr@external-agency-mail.net</span>.`,
    entitySignal: "External / Agency Poster",
    flagText: "Flag: Email Domain Mismatch",
    flagIsWarning: true,
    email: "tariq.hr@external-agency-mail.net",
    role: "Senior Full-Stack Engineer",
    metaLine: "Dubai / Remote • Full-Time • Node/Next.js",
    domainCheck: "Mismatch Flagged",
    industryCheck: "Aligned",
    missingCheck: "Company Website",
    recruiterInitials: "TM",
    recruiterName: "Tariq Mansour • Talent Acquisition",
    recruiterHeadline: "Dubai, UAE • B.A. Business Administration",
    recruiterBio: "4 years recruiting experience. Factual Cross-Check Notice: The stated application email domain (external-agency-mail.net) differs from the employer domain.",
    tenure: "4 yrs",
    companySize: "51 - 200",
    locations: "United Arab Emirates, Egypt",
    draftTo: "Tariq Mansour <tariq.hr@external-agency-mail.net>",
    draftSubject: "Application for Senior Full-Stack Engineer - Candidate Name",
    draftBody: "Dear Tariq Mansour, I am writing to express my interest in the Senior Full-Stack Engineer (Node.js / Next.js) position. Please find my resume attached from Google Drive for your review.",
    commEn: {
      title: "Senior Full-Stack Engineer — MENA FinTech",
      meta: "Location: Dubai / Remote  |  Job Type: Full-Time  |  Stack: Node.js & Next.js",
      summary: "MENA FinTech platform (51–200 employees • UAE, Egypt) is hiring a Senior Full-Stack Engineer. Note: Applications are managed via an external recruitment domain.",
      apply: "Apply via Email: tariq.hr@external-agency-mail.net"
    },
    commAr: {
      title: "مطور Full-Stack أول (Node.js / Next.js) — قطاع التقنية المالية",
      meta: "الموقع: دبي / عن بُعد  |  الدوام: كامل  |  التقنيات: Node.js و Next.js",
      summary: "مطلوب مطور Full-Stack أول لمنصة تقنية مالية (51 - 200 موظف • الإمارات، مصر). ملاحظة: يتم استقبال الطلبات عبر بريد مكتب توظيف خارجي.",
      apply: "للتقديم عبر البريد: tariq.hr@external-agency-mail.net"
    },
    ar: {
      expandedUrl: "تم التحقق: linkedin.com/posts/external-recruiter_fintech-opening",
      authorMeta: "الناشر: طارق منصور • أخصائي استقطاب الكفاءات",
      entitySignal: "جهة توظيف خارجية / وكالة",
      flagText: "تنبيه: اختلاف نطاق بريد التقديم",
      role: "مطور Full-Stack أول (Node/Next.js)",
      metaLine: "دبي / عن بُعد • دوام كامل • Node/Next.js",
      domainCheck: "تم رصد اختلاف",
      industryCheck: "متوافق",
      missingCheck: "موقع الشركة الرسمي",
      recruiterName: "طارق منصور • استقطاب الكفاءات",
      recruiterHeadline: "دبي، الإمارات • بكالوريوس إدارة أعمال",
      recruiterBio: "4 سنوات خبرة في التوظيف. إشعار التدقيق المتقاطع: نطاق بريد التقديم المعلن (external-agency-mail.net) يختلف عن نطاق جهة العمل.",
      tenure: "4 سنوات",
      locations: "الإمارات العربية المتحدة، مصر",
      draftSubject: "طلب تقديم لوظيفة مطور Full-Stack أول - اسم المتقدم",
      draftBody: "الأستاذ طارق منصور، أتقدم بطلب ترشحي لشغل وظيفة مطور برمجيات متكامل أول (Full-Stack). أرفق لكم سيرتي الذاتية المحدثة من Google Drive لمراجعتها."
    }
  }
};

export function getLocalizedPreset(preset: PresetData, locale: string): PresetData {
  if (locale === "ar" && preset.ar) {
    return {
      ...preset,
      ...preset.ar
    };
  }
  return preset;
}
