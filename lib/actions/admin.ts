"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  updateUserStatusSchema,
  updateUserQuotaSchema,
  deleteUserSchema,
  type UpdateUserStatusInput,
  type UpdateUserQuotaInput,
  type DeleteUserInput,
} from "@/lib/validation/admin";
import {
  updateUserRoleAndStatus,
  updateUserWorkflowQuota,
  getActiveAdminCount,
  deleteUserById,
} from "@/lib/db/queries/admin";
import { getUserById } from "@/lib/db/queries/users";
import type { User } from "@/lib/db/schema/users";

export {
  updateWorkflowAction,
  uploadWorkflowImageAction,
} from "./admin-workflows";

// ---------------------------------------------------------------------------
// Auth helpers — shared across all admin actions
// ---------------------------------------------------------------------------

type CallerRole = User["role"];

async function resolveCaller(): Promise<
  { ok: false; error: string } | { ok: true; caller: User; callerId: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized: Please sign in" };
  }
  const caller = await getUserById(session.user.id);
  if (!caller || caller.status === "locked") {
    return { ok: false, error: "Unauthorized: Account not accessible" };
  }
  return { ok: true, caller, callerId: session.user.id };
}

/** admin, editor, viewer can open the admin panel */
function isAdminPanelRole(role: CallerRole): boolean {
  return role === "admin" || role === "editor" || role === "viewer";
}

/** admin + editor can write subscriptions and quota */
function canManageSubscriptions(role: CallerRole): boolean {
  return role === "admin" || role === "editor";
}

/** Only admins perform destructive / privilege-elevation operations */
function isAdmin(role: CallerRole): boolean {
  return role === "admin";
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Role-aware user status / role update.
 *
 * Permission matrix:
 * - admin  => can change any user's role/status, including promoting/demoting admins
 * - editor => can approve/lock/reject/unlock non-admin users only; cannot touch
 *             the `role` field; cannot act on other admins
 * - viewer => no writes at all
 */
export async function updateUserStatusAction(input: UpdateUserStatusInput) {
  const res = await resolveCaller();
  if (!res.ok) return { success: false, error: res.error };

  const { caller } = res;

  if (!isAdminPanelRole(caller.role)) {
    return { success: false, error: "Unauthorized: Insufficient privileges" };
  }

  if (caller.role === "viewer") {
    return { success: false, error: "Unauthorized: Viewers cannot modify users" };
  }

  const parsed = updateUserStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid user update parameters" };
  }

  const target = await getUserById(parsed.data.userId);
  if (!target) {
    return { success: false, error: "User not found" };
  }

  // --- Editor-specific restrictions ---
  if (caller.role === "editor") {
    // Editors must not touch the role field at all
    if (parsed.data.role !== undefined) {
      return { success: false, error: "Unauthorized: Only admins can change user roles" };
    }
    // Editors must not act on admin accounts
    if (target.role === "admin") {
      return {
        success: false,
        error: "Unauthorized: Editors cannot modify administrator accounts",
      };
    }
  }

  // --- Admin: guard against demoting/locking the last admin ---
  if (caller.role === "admin") {
    const isDemotingAdmin =
      target.role === "admin" &&
      parsed.data.role !== undefined &&
      parsed.data.role !== "admin";
    const isLockingAdmin =
      target.role === "admin" &&
      (parsed.data.status === "locked" || parsed.data.status === "rejected");

    if (isDemotingAdmin || isLockingAdmin) {
      const activeAdminCount = await getActiveAdminCount();
      if (activeAdminCount <= 1) {
        return {
          success: false,
          error:
            "Cannot demote or lock this administrator because they are the only administrator. Designate another administrator first.",
        };
      }
    }
  }

  try {
    const success = await updateUserRoleAndStatus(parsed.data.userId, {
      role: parsed.data.role,
      status: parsed.data.status,
    });

    if (!success) {
      return { success: false, error: "User not found or update failed" };
    }

    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

/** Admin-only: permanently delete a user and all associated data */
export async function deleteUserAction(input: DeleteUserInput) {
  const res = await resolveCaller();
  if (!res.ok) return { success: false, error: res.error };

  if (!isAdmin(res.caller.role)) {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  const parsed = deleteUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid user deletion parameters" };
  }

  const target = await getUserById(parsed.data.userId);
  if (!target) {
    return { success: false, error: "User not found" };
  }

  if (target.role === "admin") {
    const activeAdminCount = await getActiveAdminCount();
    if (activeAdminCount <= 1) {
      return {
        success: false,
        error:
          "Cannot delete this administrator because they are the only administrator in the system. Designate another administrator first.",
      };
    }
  }

  try {
    const success = await deleteUserById(parsed.data.userId);
    if (!success) {
      return { success: false, error: "Failed to delete user record" };
    }

    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

/** Admin + Editor: adjust workflow usage quota for a user */
export async function updateUserQuotaAction(input: UpdateUserQuotaInput) {
  const res = await resolveCaller();
  if (!res.ok) return { success: false, error: res.error };

  if (!canManageSubscriptions(res.caller.role)) {
    return {
      success: false,
      error: "Unauthorized: Admin or Editor privileges required",
    };
  }

  const parsed = updateUserQuotaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid quota parameters" };
  }

  try {
    const success = await updateUserWorkflowQuota(
      parsed.data.userId,
      parsed.data.workflowSlug,
      {
        usageLimit: parsed.data.usageLimit,
        resetCount: parsed.data.resetCount,
      }
    );

    if (!success) {
      return { success: false, error: "Workflow access row not found" };
    }

    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update quota",
    };
  }
}
