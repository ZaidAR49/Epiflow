import { Inngest } from "inngest";

export type JobAnalyzeEventData = {
  runId: string;
  userId: string;
  url: string;
  language: "ar" | "en";
  workflowSlug?: string;
};

export const inngest = new Inngest({
  id: "jobpost-x-ray",
});
