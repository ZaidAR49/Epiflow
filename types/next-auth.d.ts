import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "admin" | "editor" | "viewer" | "user" | "guest";
      status?: "pending" | "approved" | "rejected" | "locked";
      isSubscribed?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: "admin" | "editor" | "viewer" | "user" | "guest";
    status?: "pending" | "approved" | "rejected" | "locked";
    isSubscribed?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: "admin" | "editor" | "viewer" | "user" | "guest";
    status?: "pending" | "approved" | "rejected" | "locked";
    isSubscribed?: boolean;
  }
}
