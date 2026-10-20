import { describe, it, expect } from "vitest";
import { structuredReportSchema, type StructuredReport } from "@/lib/validation/report";

describe("Dashboard Structured Report & History Intelligence", () => {
  const validReportSample: StructuredReport = {
    role: {
      title: "Senior Full-Stack Engineer",
      company: "Acme Cloud Corp",
      location: "Dubai, UAE (Hybrid)",
      jobType: "Full-time",
      experienceLevel: "Senior",
      summary: "Leading development of scalable cloud microservices.",
      responsibilities: ["Architect services", "Mentor junior devs"],
      requirements: ["5+ years TypeScript", "Next.js & PostgreSQL"],
      preferredSkills: ["Inngest", "Docker"],
      howToApply: "Email your resume directly to careers@acme.com",
    },
    poster: {
      isCompanyPost: false,
      name: "Sarah Al-Mansoor",
      title: "Head of Talent Acquisition",
      location: "Dubai, United Arab Emirates",
      education: "BS Computer Science",
      experienceSummary: "8 years recruitment in MENA tech ecosystem.",
    },
    company: {
      name: "Acme Cloud Corp",
      industry: "Software & Cloud Infrastructure",
      size: "201-500 employees",
      geographicPresence: "Dubai, Riyadh, London",
      website: "https://acmecloud.io",
      bio: "Empowering modern enterprise engineering teams.",
    },
    flags: [
      {
        type: "info",
        label: "Direct Recruiter Post",
        observation: "Published by verified Head of Talent Acquisition.",
      },
      {
        type: "warning",
        label: "Tight Deadline",
        observation: "Application period closes within 48 hours.",
      },
    ],
  };

  it("validates compliant structured report schema successfully", () => {
    const parsed = structuredReportSchema.safeParse(validReportSample);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.role.title).toBe("Senior Full-Stack Engineer");
      expect(parsed.data.flags).toHaveLength(2);
      expect(parsed.data.flags[1]?.type).toBe("warning");
    }
  });

  it("handles company page posts without individual author", () => {
    const companyReportSample: StructuredReport = {
      ...validReportSample,
      poster: {
        isCompanyPost: true,
        name: null,
        title: null,
        location: null,
        education: null,
        experienceSummary: null,
      },
    };
    const parsed = structuredReportSchema.safeParse(companyReportSample);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.poster.isCompanyPost).toBe(true);
      expect(parsed.data.poster.name).toBeNull();
    }
  });

  it("preserves flags with distinct warning vs info semantics", () => {
    const flags = validReportSample.flags;
    const warningFlags = flags.filter((f) => f.type === "warning");
    const infoFlags = flags.filter((f) => f.type === "info");

    expect(warningFlags).toHaveLength(1);
    expect(infoFlags).toHaveLength(1);
    expect(warningFlags[0]?.label).toBe("Tight Deadline");
  });
});
