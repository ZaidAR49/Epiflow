import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getServerEnv } from "@/lib/env";
import { saveWorkflowGoogleCredential } from "@/lib/db/queries/credentials";
import { z } from "zod";

const googleTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  const origin = req.nextUrl.origin;

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/en/sign-in", origin));
  }

  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get("wf_oauth_state")?.value;

  const env = getServerEnv();
  const effectiveSlug =
    slug.toLowerCase() === "epiflow" ||
    slug.toLowerCase() === (env.NEXT_PUBLIC_PLATFORM_NAME || "epiflow").toLowerCase()
      ? "job-xray"
      : slug;

  if (!code || !state || state !== cookieState) {
    return NextResponse.redirect(
      new URL(`/en/workflows/${effectiveSlug}?error=invalid_state`, origin)
    );
  }

  const redirectUri =
    env.GOOGLE_WORKFLOW_REDIRECT_URI?.trim() ||
    `${origin}/api/workflows/${slug}/auth/google/callback`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID || "",
        client_secret: env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL(`/en/workflows/${effectiveSlug}?error=token_exchange_failed`, origin)
      );
    }

    const tokenData: unknown = await tokenRes.json();
    const parsedTokens = googleTokenResponseSchema.safeParse(tokenData);

    if (!parsedTokens.success) {
      return NextResponse.redirect(
        new URL(`/en/workflows/${effectiveSlug}?error=invalid_token_payload`, origin)
      );
    }

    const { access_token, refresh_token, scope } = parsedTokens.data;

    // 2. Fetch the connected user's email address
    let accountEmail = session.user.email || "user@gmail.com";
    try {
      const userInfoRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      if (userInfoRes.ok) {
        const info = (await userInfoRes.json()) as { email?: string };
        if (info.email) accountEmail = info.email;
      }
    } catch {
      // Fallback to session email
    }

    // 3. Store refresh token in workflow_credentials
    if (refresh_token) {
      await saveWorkflowGoogleCredential({
        userId: session.user.id,
        workflowSlug: effectiveSlug,
        refreshToken: refresh_token,
        accountEmail,
        scopes: scope ? scope.split(" ") : undefined,
      });
    }

    const successResponse = NextResponse.redirect(
      new URL(`/en/workflows/${effectiveSlug}/console?credential_status=connected`, origin)
    );
    successResponse.cookies.delete("wf_oauth_state");
    return successResponse;
  } catch {
    return NextResponse.redirect(
      new URL(`/en/workflows/${effectiveSlug}/console?error=credential_save_failed`, origin)
    );
  }
}
