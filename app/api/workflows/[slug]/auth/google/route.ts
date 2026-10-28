import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getServerEnv } from "@/lib/env";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    const origin = req.nextUrl.origin;
    return NextResponse.redirect(new URL("/en/sign-in", origin));
  }

  const env = getServerEnv();
  if (!env.GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID is not configured" },
      { status: 500 }
    );
  }

  const origin = req.nextUrl.origin;
  const requestedLocale = req.nextUrl.searchParams.get("locale");
  const locale = requestedLocale === "ar" || requestedLocale === "en" ? requestedLocale : "en";
  const redirectUri =
    env.GOOGLE_WORKFLOW_REDIRECT_URI?.trim() ||
    `${origin}/api/workflows/${slug}/auth/google/callback`;
  const state = Buffer.from(
    JSON.stringify({
      userId: session.user.id,
      slug,
      locale,
      t: Date.now(),
    })
  ).toString("base64url");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/userinfo.email"
  );
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent");
  googleAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(googleAuthUrl.toString());
  response.cookies.set("wf_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
