import type { Plan } from "@/types";

export interface CommunityPostFormat {
  title: string;
  meta: string;
  summary: string;
  apply: string;
}

export interface PresetData {
  url: string;
  expandedUrl: string;
  authorMeta: string;
  postHtml: string;
  entitySignal: string;
  flagText: string;
  flagIsWarning: boolean;
  email: string;
  role: string;
  metaLine: string;
  domainCheck: string;
  industryCheck: string;
  missingCheck: string;
  recruiterInitials: string;
  recruiterName: string;
  recruiterHeadline: string;
  recruiterBio: string;
  tenure: string;
  companySize: string;
  locations: string;
  draftTo: string;
  draftSubject: string;
  draftBody: string;
  commEn: CommunityPostFormat;
  commAr: CommunityPostFormat;
  ar?: Partial<Omit<PresetData, "commEn" | "commAr" | "ar">>;
}

export type PricingBillingMode = "monthly" | "yearly" | "payg";

export interface WorkflowLandingProps {
  slug: string;
  workflowName?: string;
  imageUrl?: string | null;
  hasAccess?: boolean;
  isAuthenticated?: boolean;
  plans?: Plan[];
  currentPlanId?: string | null;
  currentPlanCode?: string | null;
}
