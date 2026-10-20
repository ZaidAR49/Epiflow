import "server-only";
import { eq, and, ne } from "drizzle-orm";
import { db } from "../client";
import { users, type User, type NewUser } from "../schema/users";
import { userIdentities } from "../schema/user-identities";

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const identity = await db
    .select({ user: users })
    .from(userIdentities)
    .innerJoin(users, eq(users.id, userIdentities.userId))
    .where(
      and(
        eq(userIdentities.provider, "telegram"),
        eq(userIdentities.providerUserId, telegramId.toString())
      )
    )
    .limit(1);

  if (identity[0]?.user) {
    return identity[0].user;
  }

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
  const telegramIdStr = telegramId.toString();

  // 1. Unlink this telegram ID from any other user to prevent unique constraint collisions
  await db
    .update(users)
    .set({
      telegramId: null,
      username: null,
      updatedAt: new Date(),
    })
    .where(and(eq(users.telegramId, telegramId), ne(users.id, userId)));

  await db
    .delete(userIdentities)
    .where(
      and(
        eq(userIdentities.provider, "telegram"),
        eq(userIdentities.providerUserId, telegramIdStr),
        ne(userIdentities.userId, userId)
      )
    );

  // 2. Upsert identity row for this user
  await db
    .insert(userIdentities)
    .values({
      userId,
      provider: "telegram",
      providerUserId: telegramIdStr,
      handle: username ?? null,
    })
    .onConflictDoUpdate({
      target: [userIdentities.userId, userIdentities.provider],
      set: {
        providerUserId: telegramIdStr,
        handle: username ?? null,
      },
    });

  // 3. Update user record
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

export async function unlinkTelegramFromUser(userId: string): Promise<User | null> {
  await db
    .delete(userIdentities)
    .where(
      and(
        eq(userIdentities.userId, userId),
        eq(userIdentities.provider, "telegram")
      )
    );

  const result = await db
    .update(users)
    .set({
      telegramId: null,
      username: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return result[0] ?? null;
}
