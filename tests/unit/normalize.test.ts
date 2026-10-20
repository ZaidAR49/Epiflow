import { describe, it, expect } from "vitest";
import { normalizeScrapedData, isCompanyProfileUrl } from "@/lib/services/scraper/normalize";

describe("Scraped Data Normalizer", () => {
  it("detects company profile URLs properly", () => {
    expect(isCompanyProfileUrl("https://www.linkedin.com/company/google/")).toBe(true);
    expect(isCompanyProfileUrl("https://linkedin.com/company/12345")).toBe(true);
    expect(isCompanyProfileUrl("https://www.linkedin.com/in/john-doe/")).toBe(false);
    expect(isCompanyProfileUrl(undefined)).toBe(false);
  });

  it("normalizes post, author, and company data cleanly", () => {
    const rawPost = {
      text: "Join our fast growing team as a Senior Frontend Engineer!",
      author: {
        name: "Jane Smith",
        profile_url: "https://www.linkedin.com/in/janesmith/",
        headline: "Tech Recruiter @ TechCorp",
      },
    };

    const rawAuthor = {
      name: "Jane Smith",
      headline: "Tech Recruiter @ TechCorp",
      location: "San Francisco, CA",
      approx_experience_years: 7,
      about: "Passionate about engineering talent.",
    };

    const rawCompany = {
      name: "TechCorp",
      industry: "Software Development",
      company_size: "50-200 employees",
      locations: ["San Francisco, CA", "London, UK"],
      website: "https://techcorp.example.com",
      description: "Building the future of software.",
    };

    const result = normalizeScrapedData({
      url: "https://www.linkedin.com/posts/sample",
      post: rawPost,
      author: rawAuthor,
      company: rawCompany,
    });

    expect(result.post.isCompanyAuthor).toBe(false);
    expect(result.hr.name).toBe("Jane Smith");
    expect(result.hr.approx_experience_years).toBe("7");
    expect(result.company.name).toBe("TechCorp");
    expect(result.company.geographic_presence).toBe("San Francisco, CA, London, UK");
  });

  it("clears recruiter fields when author is a company page", () => {
    const rawPost = {
      text: "We are hiring engineers!",
      author: {
        name: "Acme Corp Official",
        profile_url: "https://www.linkedin.com/company/acme-corp/",
      },
    };

    const result = normalizeScrapedData({
      url: "https://www.linkedin.com/posts/company-sample",
      post: rawPost,
      author: null,
      company: { name: "Acme Corp" },
    });

    expect(result.post.isCompanyAuthor).toBe(true);
    expect(result.hr.name).toBe("");
    expect(result.hr.headline).toBe("");
  });

  it("normalizes real Apify actor shapes (firstName/lastName, object location, currentPosition)", () => {
    const rawPost = {
      text: "",
      post: {
        text: "Senior Frontend Engineer wanted!",
        url: "https://www.linkedin.com/posts/activity-12345",
      },
      author: {
        name: "Bayan Khaled",
        profile_url: "https://www.linkedin.com/in/bayan-khaled",
        company_id: null,
      },
    };

    const rawAuthor = {
      firstName: "Bayan",
      lastName: "Khaled",
      headline: "HR Officer at NARD POS",
      location: { linkedinText: "Amman, Jordan" },
      education: [{ degree: "Bachelor's degree", fieldOfStudy: "Computer Information Systems" }],
      experience: [{ startDate: { year: 2018 } }],
      currentPosition: [
        {
          companyName: "NARD POS",
          companyLinkedinUrl: "https://www.linkedin.com/company/nardpos/",
        },
      ],
    };

    const rawCompany = {
      name: "NARD POS",
      industries: [{ name: "Software Development" }],
      employeeCountRange: { start: 51, end: 200 },
      peopleStats: [
        {
          statTitle: "Locations",
          values: [{ title: "Jordan" }, { title: "Amman, Jordan" }],
        },
      ],
    };

    const result = normalizeScrapedData({
      url: "https://www.linkedin.com/posts/sample",
      post: rawPost,
      author: rawAuthor,
      company: rawCompany,
    });

    expect(result.post.text).toBe("Senior Frontend Engineer wanted!");
    expect(result.post.isCompanyAuthor).toBe(false);
    expect(result.hr.name).toBe("Bayan Khaled");
    expect(result.hr.location).toBe("Amman, Jordan");
    expect(result.hr.degree).toBe("Bachelor's degree - Computer Information Systems");
    expect(result.company.name).toBe("NARD POS");
    expect(result.company.industry).toBe("Software Development");
    expect(result.company.company_size).toBe("51-200");
    expect(result.company.geographic_presence).toBe("Jordan, Amman, Jordan");
  });
});
