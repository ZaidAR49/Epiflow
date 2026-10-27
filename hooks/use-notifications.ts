"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserNotification } from "@/lib/db/schema/user-notifications";
import {
  getMyNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteUserNotificationAction,
} from "@/lib/actions/notifications";

type Listener = () => void;

// Module-level shared store to prevent duplicate fetches across multiple header mounts (desktop/mobile)
let sharedNotifications: UserNotification[] = [];
let sharedUnreadCount = 0;
let sharedIsLoading = false;
let hasLoadedInitial = false;
let inFlightFetch: Promise<void> | null = null;
let activeSubscribers = 0;
let pollIntervalTimer: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<Listener>();

function emitChange() {
  for (const listener of subscribers) {
    listener();
  }
}

async function executeFetch(): Promise<void> {
  if (inFlightFetch) {
    return inFlightFetch;
  }

  sharedIsLoading = true;
  emitChange();

  inFlightFetch = (async () => {
    try {
      const res = await getMyNotificationsAction();
      if (res.success && Array.isArray(res.notifications)) {
        sharedNotifications = res.notifications;
        sharedUnreadCount = res.unreadCount;
        hasLoadedInitial = true;
      }
    } catch {
      // Non-critical background failure
    } finally {
      sharedIsLoading = false;
      inFlightFetch = null;
      emitChange();
    }
  })();

  return inFlightFetch;
}

function startPolling() {
  if (pollIntervalTimer) return;
  pollIntervalTimer = setInterval(() => {
    void executeFetch();
  }, 60000);
}

function stopPolling() {
  if (pollIntervalTimer && activeSubscribers <= 0) {
    clearInterval(pollIntervalTimer);
    pollIntervalTimer = null;
  }
}

export function useNotifications(isSignedIn: boolean = false) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isSignedIn) return;

    activeSubscribers += 1;
    const handleChange = () => setTick((prev) => prev + 1);
    subscribers.add(handleChange);

    if (!hasLoadedInitial && !inFlightFetch) {
      void executeFetch();
    }

    startPolling();

    return () => {
      subscribers.delete(handleChange);
      activeSubscribers = Math.max(0, activeSubscribers - 1);
      stopPolling();
    };
  }, [isSignedIn]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic local update: mark as read without removing from the list
    let wasUnread = false;
    sharedNotifications = sharedNotifications.map((n) => {
      if (n.id === notificationId) {
        if (!n.readAt) wasUnread = true;
        return { ...n, readAt: n.readAt ?? new Date() };
      }
      return n;
    });
    if (wasUnread) {
      sharedUnreadCount = Math.max(0, sharedUnreadCount - 1);
    }
    emitChange();

    try {
      await markNotificationReadAction({ notificationId });
    } catch {
      void executeFetch();
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistic local update: mark all as read without removing from the list
    const now = new Date();
    sharedNotifications = sharedNotifications.map((n) => ({
      ...n,
      readAt: n.readAt ?? now,
    }));
    sharedUnreadCount = 0;
    emitChange();

    try {
      await markAllNotificationsReadAction();
    } catch {
      void executeFetch();
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    // Optimistic local update: delete only on explicit user delete action
    const target = sharedNotifications.find((n) => n.id === notificationId);
    const wasUnread = target ? !target.readAt : false;

    sharedNotifications = sharedNotifications.filter((n) => n.id !== notificationId);
    if (wasUnread) {
      sharedUnreadCount = Math.max(0, sharedUnreadCount - 1);
    }
    emitChange();

    try {
      await deleteUserNotificationAction({ notificationId });
    } catch {
      void executeFetch();
    }
  }, []);

  const refresh = useCallback(async () => {
    if (isSignedIn) {
      await executeFetch();
    }
  }, [isSignedIn]);

  return {
    notifications: sharedNotifications,
    unreadCount: sharedUnreadCount,
    isLoading: sharedIsLoading,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
