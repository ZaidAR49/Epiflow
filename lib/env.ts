import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().min(1, "DATABASE_URL is required"),
  APIFY_TOKEN: z.string().min(1, "APIFY_TOKEN is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  ANTHROPIC_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
  TELEGRAM_BOT_SECRET_TOKEN: z.string().min(1, "TELEGRAM_BOT_SECRET_TOKEN is required"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  AUTH_URL: z.string().url().optional(),
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .length(64, "TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
    .optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `[JobPost X-Ray] Invalid server environment configuration:\n${formattedErrors}`
    );
  }
  return result.data;
}

// Lazy/cached access to avoid throwing on module load during build if env is incomplete
let parsedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (!parsedEnv) {
    parsedEnv = parseEnv();
  }
  return parsedEnv;
}
