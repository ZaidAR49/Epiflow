import "server-only";
import { eq } from "drizzle-orm";
import { db } from "../client";
import { users, type User, type NewUser } from "../schema/users";

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);
  return result[0] ?? null;
}

export async function createUser(data: NewUser): Promise<User> {
  const result = await db.insert(users).values(data).returning();
  const created = result[0];
  if (!created) {
    throw new Error("Failed to create user record");
  }
  return created;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function upsertGoogleUser(data: {
  email: string;
  fullName: string;
}): Promise<User> {
  const existing = await getUserByEmail(data.email);
  if (existing) {
    const updated = await db
      .update(users)
      .set({
        fullName: data.fullName || existing.fullName,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated[0] ?? existing;
  }

  const result = await db
    .insert(users)
    .values({
      email: data.email,
      fullName: data.fullName,
      emailVerified: true,
      status: "approved",
      role: "user",
      preferredLanguage: "ar",
    })
    .returning();

  const created = result[0];
  if (!created) {
    throw new Error("Failed to create Google user");
  }
  return created;
}

export async function updateUserProfile(
  id: string,
  data: {
    fullName?: string;
    preferredLanguage?: string;
  }
): Promise<User | null> {
  const patch: Partial<User> = { updatedAt: new Date() };
  if (data.fullName !== undefined) patch.fullName = data.fullName;
  if (data.preferredLanguage !== undefined) patch.preferredLanguage = data.preferredLanguage;

  const result = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, id))
    .returning();
  return result[0] ?? null;
}

export async function linkTelegramToUser(
  userId: string,
  telegramId: number,
  username?: string | null
): Promise<User | null> {
  const result = await db
    .update(users)
    .set({
      telegramId,
      username: username ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return result[0] ?? null;
}
