import "server-only";
import { eq, and, lte, or, isNull, gt, desc, sql } from "drizzle-orm";
import { db } from "../client";
import {
  systemAnnouncements,
  systemAnnouncementReads,
  type SystemAnnouncement,
  type NewSystemAnnouncement,
} from "../schema/system-announcements";

export interface AnnouncementReach {
  id: string;
  title: string;
  totalSent: number;
  totalRead: number;
  readRate: number;
}

export async function getActiveAnnouncements(
  now: Date = new Date()
): Promise<SystemAnnouncement[]> {
  return db
    .select()
    .from(systemAnnouncements)
    .where(
      and(
        eq(systemAnnouncements.isActive, true),
        lte(systemAnnouncements.startsAt, now),
        or(
          isNull(systemAnnouncements.endsAt),
          gt(systemAnnouncements.endsAt, now)
        )
      )
    )
    .orderBy(desc(systemAnnouncements.createdAt));
}

export async function getAllAnnouncements(): Promise<SystemAnnouncement[]> {
  return db
    .select()
    .from(systemAnnouncements)
    .orderBy(desc(systemAnnouncements.createdAt));
}

export async function getAnnouncementById(
  id: string
): Promise<SystemAnnouncement | null> {
  const result = await db
    .select()
    .from(systemAnnouncements)
    .where(eq(systemAnnouncements.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createAnnouncement(
  data: NewSystemAnnouncement
): Promise<SystemAnnouncement> {
  const result = await db.insert(systemAnnouncements).values(data).returning();
  const created = result[0];
  if (!created) {
    throw new Error("Failed to create system announcement");
  }
  return created;
}

export async function updateAnnouncement(
  id: string,
  data: Partial<NewSystemAnnouncement>
): Promise<SystemAnnouncement | null> {
  const result = await db
    .update(systemAnnouncements)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(systemAnnouncements.id, id))
    .returning();
  return result[0] ?? null;
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const result = await db
    .delete(systemAnnouncements)
    .where(eq(systemAnnouncements.id, id))
    .returning({ id: systemAnnouncements.id });
  return result.length > 0;
}

export async function toggleAnnouncementActive(
  id: string,
  isActive: boolean
): Promise<SystemAnnouncement | null> {
  const result = await db
    .update(systemAnnouncements)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(systemAnnouncements.id, id))
    .returning();
  return result[0] ?? null;
}

export async function markAnnouncementAsRead(
  userId: string,
  announcementId: string
): Promise<void> {
  await db
    .insert(systemAnnouncementReads)
    .values({ userId, announcementId, readAt: new Date() })
    .onConflictDoNothing();
}

export async function getAnnouncementReach(
  announcementId: string
): Promise<AnnouncementReach> {
  const ann = await getAnnouncementById(announcementId);
  const title = ann ? (ann.titleEn || ann.titleAr || "Announcement") : "Announcement";

  const counts = await db.execute<{
    total_users: string;
    total_reads: string;
  }>(sql`
    SELECT
      (SELECT COUNT(*)::text FROM public.users) AS total_users,
      (SELECT COUNT(*)::text FROM public.system_announcement_reads WHERE announcement_id = ${announcementId}) AS total_reads;
  `);

  const row = counts[0];
  const totalSent = Number(row?.total_users ?? 0);
  const totalRead = Number(row?.total_reads ?? 0);
  const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 1000) / 10 : 0;

  return {
    id: announcementId,
    title,
    totalSent,
    totalRead,
    readRate,
  };
}
