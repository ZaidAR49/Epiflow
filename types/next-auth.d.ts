import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "admin" | "user" | "guest";
      status?: "pending" | "approved" | "rejected" | "locked";
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: "admin" | "user" | "guest";
    status?: "pending" | "approved" | "rejected" | "locked";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: "admin" | "user" | "guest";
    status?: "pending" | "approved" | "rejected" | "locked";
  }
}
