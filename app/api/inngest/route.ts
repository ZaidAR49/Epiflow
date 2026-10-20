import { serve } from "inngest/next";
import { inngest } from "@/lib/jobs/client";
import { analyzeJobPost } from "@/lib/jobs/analysis-pipeline";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analyzeJobPost],
});
