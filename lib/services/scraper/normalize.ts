import type {
  RawPostData,
  RawAuthorData,
  RawCompanyData,
  NormalizedScrapedPayload,
} from "./types";

export function isCompanyProfileUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /linkedin\.com\/company\//i.test(url);
}

export function isCompanyAuthor(author: RawPostData["author"] | undefined): boolean {
  if (!author) return true;
  if (author.company_id != null && author.company_id !== "") return true;
  if (author.profile_url && isCompanyProfileUrl(author.profile_url)) return true;
  return false;
}

/**
 * Pure function to normalize heterogeneous scraped data from Apify actors into
 * a clean, deterministic schema ready for AI ingestion (matches n8n Extract Key Data node).
 */
export function normalizeScrapedData(params: {
  url: string;
  post: RawPostData;
  author?: RawAuthorData | null;
  company?: RawCompanyData | null;
}): NormalizedScrapedPayload {
  const { url, post, author, company } = params;

  const isAuthorACompany = isCompanyAuthor(post.author);

  const postText =
    post.post?.text ||
    post.job_description ||
    post.post_text ||
    post.text ||
    "";

  // Normalize author details
  const hrName = isAuthorACompany
    ? ""
    : author?.firstName
      ? `${author.firstName} ${author.lastName ?? ""}`.trim()
      : author?.name || post.author.name || "";

  const hrHeadline = isAuthorACompany
    ? ""
    : author?.headline || post.author.headline || "";

  let hrLocation = "";
  if (!isAuthorACompany) {
    if (typeof author?.location === "string") {
      hrLocation = author.location;
    } else if (author?.location && typeof author.location === "object" && "linkedinText" in author.location) {
      hrLocation = String(author.location.linkedinText ?? "");
    }
  }

  let hrDegree = "";
  if (!isAuthorACompany) {
    if (author?.degree) {
      hrDegree = author.degree;
    } else if (Array.isArray(author?.education) && author.education.length > 0) {
      const ed = author.education[0];
      const degree = typeof ed?.degree === "string" ? ed.degree : "";
      const field = typeof ed?.fieldOfStudy === "string" ? ed.fieldOfStudy : "";
      hrDegree = [degree, field].filter(Boolean).join(" - ");
    }
  }

  const hrAbout = isAuthorACompany ? "" : author?.about || "";

  let hrExpYears = "";
  if (!isAuthorACompany) {
    if (author?.approx_experience_years != null) {
      hrExpYears = String(author.approx_experience_years);
    } else if (Array.isArray(author?.experience) && author.experience.length > 0) {
      const years = author.experience
        .map((e) => {
          if (e && typeof e === "object" && "startDate" in e) {
            const sd = e.startDate as { year?: number } | undefined;
            return typeof sd?.year === "number" ? sd.year : null;
          }
          return null;
        })
        .filter((y): y is number => y !== null);
      if (years.length > 0) {
        hrExpYears = String(new Date().getFullYear() - Math.min(...years));
      }
    }
  }

  // Normalize company details
  const companyName = company?.name || "";
  const companyIndustry =
    company?.industry ||
    (Array.isArray(company?.industries) && company.industries[0]?.name ? company.industries[0].name : "");

  const companySize = company?.company_size
    ? String(company.company_size)
    : company?.employeeCountRange
      ? `${company.employeeCountRange.start ?? ""}-${company.employeeCountRange.end ?? ""}`
      : company?.employee_count
        ? String(company.employee_count)
        : "";

  let geoPresence = "";
  if (Array.isArray(company?.locations)) {
    geoPresence = company.locations.filter(Boolean).slice(0, 5).join(", ");
  } else if (typeof company?.locations === "string") {
    geoPresence = company.locations;
  } else if (Array.isArray(company?.peopleStats)) {
    const locStat = company.peopleStats.find((s) => s.statTitle === "Locations");
    if (locStat && Array.isArray(locStat.values)) {
      geoPresence = (locStat.values as Array<{ title?: string }>)
        .map((v) => v.title)
        .filter(Boolean)
        .slice(0, 5)
        .join(", ");
    }
  }

  const companyWebsite = company?.website || "";
  const companyDescription = company?.description || "";

  return {
    post: {
      text: postText.trim(),
      url,
      isCompanyAuthor: isAuthorACompany,
    },
    hr: {
      name: hrName.trim(),
      headline: hrHeadline.trim(),
      location: hrLocation.trim(),
      degree: hrDegree.trim(),
      approx_experience_years: hrExpYears.trim(),
      about: hrAbout.trim(),
    },
    company: {
      name: companyName.trim(),
      industry: companyIndustry.trim(),
      company_size: companySize.trim(),
      geographic_presence: geoPresence.trim(),
      website: companyWebsite.trim(),
      description: companyDescription.trim(),
    },
  };
}
