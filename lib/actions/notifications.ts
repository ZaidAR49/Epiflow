"use server";

import { auth } from "@/auth";
import {
  sendNotificationSchema,
  markNotificationReadSchema,
  deleteNotificationSchema,
} from "@/lib/validation/notifications";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteUserNotification,
  createUserNotification,
  sendBroadcastNotification,
  getNotificationReach,
  getRecentDispatchedNotifications,
} from "@/lib/db/queries/user-notifications";
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

export async function getMyNotificationsAction() {
  const authCheck = await verifyAuthUser();
  if (!authCheck.ok) {
    return {
      success: false as const,
      error: authCheck.error,
      notifications: [],
      unreadCount: 0,
    };
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(authCheck.userId, 30),
      getUnreadNotificationCount(authCheck.userId),
    ]);

    return {
      success: true as const,
      notifications,
      unreadCount,
    };
  } catch (error) {
    logger.error({ err: error, userId: authCheck.userId }, "Failed to fetch notifications");
    return {
      success: false as const,
      error: "Failed to load notifications",
      notifications: [],
      unreadCount: 0,
    };
  }
}

export async function markNotificationReadAction(rawInput: unknown) {
  const authCheck = await verifyAuthUser();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = markNotificationReadSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid notification ID" };
  }

  try {
    const updated = await markNotificationAsRead(
      authCheck.userId,
      parsed.data.notificationId
    );

    return { success: true, notification: updated };
  } catch (error) {
    logger.error({ err: error }, "Failed to mark notification as read");
    return { success: false, error: "Failed to mark notification as read" };
  }
}

export async function markAllNotificationsReadAction() {
  const authCheck = await verifyAuthUser();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  try {
    const count = await markAllNotificationsAsRead(authCheck.userId);
    return { success: true, count };
  } catch (error) {
    logger.error({ err: error }, "Failed to mark all notifications as read");
    return { success: false, error: "Failed to mark all as read" };
  }
}

export async function deleteUserNotificationAction(rawInput: unknown) {
  const authCheck = await verifyAuthUser();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = deleteNotificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid notification ID" };
  }

  try {
    const deleted = await deleteUserNotification(
      authCheck.userId,
      parsed.data.notificationId
    );

    return { success: deleted };
  } catch (error) {
    logger.error({ err: error }, "Failed to delete notification");
    return { success: false, error: "Failed to delete notification" };
  }
}

export async function sendNotificationAction(rawInput: unknown) {
  const authCheck = await verifyEditorOrAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = sendNotificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid notification data";
    return { success: false, error: errorMsg };
  }

  try {
    const data = parsed.data;

    if (data.recipientMode === "single" && data.userId) {
      await createUserNotification({
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body || null,
        link: data.link || null,
      });

      return { success: true, count: 1 };
    }

    const count = await sendBroadcastNotification({
      type: data.type,
      title: data.title,
      body: data.body || null,
      link: data.link || null,
    });

    return { success: true, count };
  } catch (error) {
    logger.error({ err: error }, "Failed to send notification");
    const message =
      error instanceof Error ? error.message : "Failed to send notification";
    return { success: false, error: message };
  }
}

export async function getNotificationReachAction(title: string) {
  const authCheck = await verifyEditorOrAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  try {
    const reach = await getNotificationReach(title.trim());
    return { success: true, reach };
  } catch (error) {
    logger.error({ err: error, title }, "Failed to fetch notification reach");
    return { success: false, error: "Failed to load notification reach" };
  }
}

export async function getRecentDispatchedNotificationsAction() {
  const authCheck = await verifyEditorOrAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error, items: [] };
  }

  try {
    const items = await getRecentDispatchedNotifications(15);
    return { success: true, items };
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch recent dispatched notifications");
    return { success: false, error: "Failed to load dispatched notifications", items: [] };
  }
}
