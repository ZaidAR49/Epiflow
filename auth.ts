import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getServerEnv } from "@/lib/env";
import { upsertGoogleUser, getUserById } from "@/lib/db/queries/users";
import { ensureUserWorkflowAccess } from "@/lib/db/queries/access";
import { getUserSubscription } from "@/lib/db/queries/subscriptions";

const env = getServerEnv();

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: env.AUTH_SECRET || "ee78a13c1a26c1f2e9698b8ce98fa714377b1051fc1d7829b5c06508275e7277",
  // Required: trust incoming host header so PKCE cookies round-trip correctly
  // in development and behind reverse proxies in production.
  trustHost: true,
  // Explicitly pin the PKCE cookie name to avoid the __Secure- prefix mismatch
  // that occurs between the /signin and /callback legs under Turbopack in dev.
  // Without this, Auth.js can set the cookie as "authjs.pkce.code_verifier" but
  // attempt to read it back as "__Secure-authjs.pkce.code_verifier" (or vice versa),
  // producing the "pkceCodeVerifier could not be parsed" InvalidCheck error.
  cookies: {
    pkceCodeVerifier: {
      name: "authjs.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutes
      },
    },
  },
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email) return false;
      try {
        const dbUser = await upsertGoogleUser({
          email: user.email,
          fullName: user.name || "User",
        });

        await ensureUserWorkflowAccess(dbUser.id, "job-xray", 5);
        user.id = dbUser.id;
        user.role = dbUser.role;
        user.status = dbUser.status;
        const pic =
          (user.image as string | undefined) ||
          ((profile as { picture?: string })?.picture) ||
          undefined;
        if (pic) {
          user.image = pic;
        }
        return true;
      } catch {
        return false;
      }
    },
    async jwt({ token, user, profile }) {
      if (user?.id) {
        token.userId = user.id;
        token.role = user.role;
        token.status = user.status;
        const pic =
          (user.image as string | undefined) ||
          ((profile as { picture?: string })?.picture) ||
          undefined;
        if (pic) {
          token.picture = pic;
        }
      }
      if (typeof token.userId === "string") {
        try {
          const [dbUser, sub] = await Promise.all([
            getUserById(token.userId),
            getUserSubscription(token.userId),
          ]);
          if (dbUser) {
            token.role = dbUser.role;
            token.status = dbUser.status;
          }
          token.isSubscribed = Boolean(
            sub && (sub.status === "active" || sub.status === "trialing")
          );
        } catch {
          // Keep existing token values if DB query fails
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.userId === "string" && session.user) {
        session.user.id = token.userId;
      }
      if (typeof token.picture === "string" && session.user) {
        session.user.image = token.picture;
      }
      if (session.user) {
        session.user.isSubscribed = Boolean(token.isSubscribed);
      }
      if (
        session.user &&
        (token.role === "admin" ||
          token.role === "editor" ||
          token.role === "viewer" ||
          token.role === "user" ||
          token.role === "guest")
      ) {
        session.user.role = token.role;
      }
      if (
        session.user &&
        (token.status === "pending" ||
          token.status === "approved" ||
          token.status === "rejected" ||
          token.status === "locked")
      ) {
        session.user.status = token.status;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
});
