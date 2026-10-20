import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getServerEnv } from "@/lib/env";
import { upsertGoogleUser, getUserById } from "@/lib/db/queries/users";
import { ensureUserWorkflowAccess } from "@/lib/db/queries/access";

const env = getServerEnv();

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: env.AUTH_SECRET || "ee78a13c1a26c1f2e9698b8ce98fa714377b1051fc1d7829b5c06508275e7277",
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

        await ensureUserWorkflowAccess(dbUser.id, "job-xray");
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
      } else if (typeof token.userId === "string") {
        try {
          const dbUser = await getUserById(token.userId);
          if (dbUser) {
            token.role = dbUser.role;
            token.status = dbUser.status;
            if (!token.picture && dbUser.image) {
              token.picture = dbUser.image;
            }
          }
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
      if (
        session.user &&
        (token.role === "admin" || token.role === "user" || token.role === "guest")
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
