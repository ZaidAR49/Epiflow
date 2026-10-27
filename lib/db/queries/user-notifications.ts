import "server-only";
import { eq, and, desc, isNull, count, sql } from "drizzle-orm";
import { db } from "../client";
import {
  userNotifications,
  type UserNotification,
  type NewUserNotification,
} from "../schema/user-notifications";
import { users } from "../schema/users";

export interface NotificationReach {
  title: string;
  totalSent: number;
  totalRead: number;
  readRate: number;
}

export interface DispatchedNotificationSummary {
  type: string;
  title: string;
  totalSent: number;
  totalRead: number;
  lastSentAt: Date;
}

/**
 * Returns recent notifications for a specific user, ordered by creation date descending.
 */
export async function getUserNotifications(
  userId: string,
  limit = 30
): Promise<UserNotification[]> {
  return db
    .select()
    .from(userNotifications)
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(userNotifications)
    .where(
      and(
        eq(userNotifications.userId, userId),
        isNull(userNotifications.readAt)
      )
    );
  return Number(result[0]?.value ?? 0);
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<UserNotification | null> {
  const result = await db
    .update(userNotifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(userNotifications.id, notificationId),
        eq(userNotifications.userId, userId)
      )
    )
    .returning();
  return result[0] ?? null;
}

export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const result = await db
    .update(userNotifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(userNotifications.userId, userId),
        isNull(userNotifications.readAt)
      )
    )
    .returning({ id: userNotifications.id });
  return result.length;
}

export async function createUserNotification(
  data: NewUserNotification
): Promise<UserNotification> {
  const result = await db.insert(userNotifications).values(data).returning();
  const created = result[0];
  if (!created) {
    throw new Error("Failed to create user notification");
  }
  return created;
}

export async function sendBroadcastNotification(data: {
  userIds?: string[];
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
}): Promise<number> {
  let targetUserIds = data.userIds;
  if (!targetUserIds || targetUserIds.length === 0) {
    const allUsers = await db.select({ id: users.id }).from(users);
    targetUserIds = allUsers.map((u) => u.id);
  }

  if (targetUserIds.length === 0) {
    return 0;
  }

  const rows: NewUserNotification[] = targetUserIds.map((userId) => ({
    userId,
    type: data.type,
    title: data.title,
    body: data.body ?? null,
    link: data.link ?? null,
  }));

  const chunkSize = 100;
  let totalInserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const res = await db
      .insert(userNotifications)
      .values(chunk)
      .returning({ id: userNotifications.id });
    totalInserted += res.length;
  }

  return totalInserted;
}

export async function deleteUserNotification(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const result = await db
    .delete(userNotifications)
    .where(
      and(
        eq(userNotifications.id, notificationId),
        eq(userNotifications.userId, userId)
      )
    )
    .returning({ id: userNotifications.id });
  return result.length > 0;
}

/**
 * Simple, per-notification reach lookup: Total Sent vs Total Read.
 */
export async function getNotificationReach(title: string): Promise<NotificationReach> {
  const result = await db.execute<{
    total_sent: string;
    total_read: string;
  }>(sql`
    SELECT
      COUNT(*)::text AS total_sent,
      COUNT(read_at)::text AS total_read
    FROM public.user_notifications
    WHERE title = ${title} OR title ILIKE ${`%${title}%`};
  `);

  const row = result[0];
  const totalSent = Number(row?.total_sent ?? 0);
  const totalRead = Number(row?.total_read ?? 0);
  const readRate =
    totalSent > 0 ? Math.round((totalRead / totalSent) * 1000) / 10 : 0;

  return {
    title,
    totalSent,
    totalRead,
    readRate,
  };
}

/**
 * Retrieves recent dispatched notification campaigns with total sent and total read.
 */
export async function getRecentDispatchedNotifications(
  limit = 15
): Promise<DispatchedNotificationSummary[]> {
  const result = await db.execute<{
    type: string;
    title: string;
    total_sent: string;
    total_read: string;
    last_sent_at: string;
  }>(sql`
    SELECT
      type,
      title,
      COUNT(*)::text AS total_sent,
      COUNT(read_at)::text AS total_read,
      MAX(created_at) AS last_sent_at
    FROM public.user_notifications
    GROUP BY type, title
    ORDER BY MAX(created_at) DESC
    LIMIT ${limit};
  `);

  return result.map((r) => ({
    type: r.type,
    title: r.title,
    totalSent: Number(r.total_sent ?? 0),
    totalRead: Number(r.total_read ?? 0),
    lastSentAt: new Date(r.last_sent_at),
  }));
}
