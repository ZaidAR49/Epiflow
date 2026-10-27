"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  deleteAnnouncementSchema,
  toggleAnnouncementSchema,
} from "@/lib/validation/notifications";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementActive,
  getActiveAnnouncements,
  markAnnouncementAsRead,
  getAnnouncementReach,
} from "@/lib/db/queries/system-announcements";
import { getUserById } from "@/lib/db/queries/users";
import { logger } from "@/lib/logger";

async function verifyAuthUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Unauthorized: Please sign in" };
  }
  return { ok: true as const, userId: session.user.id };
}

async function verifyEditorOrAdminCaller() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Unauthorized: Please sign in" };
  }

  const caller = await getUserById(session.user.id);
  if (
    !caller ||
    (caller.role !== "admin" && caller.role !== "editor") ||
    caller.status === "locked"
  ) {
    return {
      ok: false as const,
      error: "Unauthorized: Admin or Editor privileges required",
    };
  }

  return { ok: true as const, callerId: session.user.id };
}

export async function createAnnouncementAction(rawInput: unknown) {
  const authCheck = await verifyEditorOrAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = createAnnouncementSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid announcement data";
    return { success: false, error: errorMsg };
  }

  try {
    const data = parsed.data;
    const created = await createAnnouncement({
      type: data.type,
      severity: data.severity,
      titleAr: data.titleAr || null,
      titleEn: data.titleEn || null,
      bodyAr: data.bodyAr || null,
      bodyEn: data.bodyEn || null,
      isActive: data.isActive,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      createdBy: authCheck.callerId,
    });

    revalidatePath("/", "layout");
    revalidatePath("/[locale]/admin", "page");

    return { success: true, announcement: created };
  } catch (error) {
    logger.error({ err: error }, "Failed to create system announcement");
    const message =
      error instanceof Error ? error.message : "Failed to create announcement";
    return { success: false, error: message };
  }
}

export async function updateAnnouncementAction(rawInput: unknown) {
  const authCheck = await verifyEditorOrAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = updateAnnouncementSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid announcement data";
    return { success: false, error: errorMsg };
  }

  try {
    const { id, ...rest } = parsed.data;
    const updated = await updateAnnouncement(id, {
      type: rest.type,
      severity: rest.severity,
      titleAr: rest.titleAr || null,
      titleEn: rest.titleEn || null,
      bodyAr: rest.bodyAr || null,
      bodyEn: rest.bodyEn || null,
      isActive: rest.isActive,
      startsAt: rest.startsAt,
      endsAt: rest.endsAt,
    });

    if (!updated) {
      return { success: false, error: "Announcement not found" };
    }

    revalidatePath("/", "layout");
    revalidatePath("/[locale]/admin", "page");

    return { success: true, announcement: updated };
  } catch (error) {
    logger.error({ err: error }, "Failed to update system announcement");
    const message =
      error instanceof Error ? error.message : "Failed to update announcement";
    return { success: false, error: message };
  }
}

export async function deleteAnnouncementAction(rawInput: unknown) {
  const authCheck = await verifyEditorOrAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = deleteAnnouncementSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid announcement ID" };
  }

  try {
    const deleted = await deleteAnnouncement(parsed.data.id);
    if (!deleted) {
      return { success: false, error: "Announcement not found" };
    }

    revalidatePath("/", "layout");
    revalidatePath("/[locale]/admin", "page");

    return { success: true };
  } catch (error) {
    logger.error({ err: error }, "Failed to delete system announcement");
    const message =
      error instanceof Error ? error.message : "Failed to delete announcement";
    return { success: false, error: message };
  }
}

export async function toggleAnnouncementActiveAction(rawInput: unknown) {
  const authCheck = await verifyEditorOrAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = toggleAnnouncementSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid announcement payload" };
  }

  try {
    const updated = await toggleAnnouncementActive(
      parsed.data.id,
      parsed.data.isActive
    );

    if (!updated) {
      return { success: false, error: "Announcement not found" };
    }

    revalidatePath("/", "layout");
    revalidatePath("/[locale]/admin", "page");

    return { success: true, announcement: updated };
  } catch (error) {
    logger.error({ err: error }, "Failed to toggle announcement status");
    const message =
      error instanceof Error ? error.message : "Failed to toggle announcement";
    return { success: false, error: message };
  }
}

export async function getActiveAnnouncementsAction() {
  const authCheck = await verifyAuthUser();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error, announcements: [] };
  }

  try {
    const announcements = await getActiveAnnouncements();
    return { success: true, announcements };
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch active announcements");
    return { success: false, announcements: [] };
  }
}

export async function markAnnouncementReadAction(announcementId: string) {
  const authCheck = await verifyAuthUser();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  try {
    await markAnnouncementAsRead(authCheck.userId, announcementId);
    return { success: true };
  } catch (error) {
    logger.error({ err: error, announcementId }, "Failed to mark announcement as read");
    return { success: false, error: "Failed to mark announcement as read" };
  }
}

export async function getAnnouncementReachAction(announcementId: string) {
  const authCheck = await verifyEditorOrAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  try {
    const reach = await getAnnouncementReach(announcementId);
    return { success: true, reach };
  } catch (error) {
    logger.error({ err: error, announcementId }, "Failed to fetch announcement reach");
    return { success: false, error: "Failed to load announcement reach" };
  }
}
