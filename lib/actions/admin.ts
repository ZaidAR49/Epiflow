"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  updateWorkflowSchema,
  updateUserStatusSchema,
  updateUserQuotaSchema,
  deleteUserSchema,
  type UpdateWorkflowInput,
  type UpdateUserStatusInput,
  type UpdateUserQuotaInput,
  type DeleteUserInput,
} from "@/lib/validation/admin";
import {
  updateWorkflowDetails,
  updateUserRoleAndStatus,
  updateUserWorkflowQuota,
  getActiveAdminCount,
  deleteUserById,
} from "@/lib/db/queries/admin";
import { getUserById } from "@/lib/db/queries/users";
import {
  validateImageFile,
  uploadPublicImage,
} from "@/lib/services/storage/supabase-storage";
import { isErr } from "@/lib/result";
import type { User } from "@/lib/db/schema/users";

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

/** Admin-only: update workflow details (name, active state, image URL) */
export async function updateWorkflowAction(input: UpdateWorkflowInput) {
  const res = await resolveCaller();
  if (!res.ok) return { success: false, error: res.error };

  if (!isAdmin(res.caller.role)) {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  const parsed = updateWorkflowSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid workflow update parameters" };
  }

  try {
    const success = await updateWorkflowDetails(parsed.data.workflowId, {
      isActive: parsed.data.isActive,
      imageUrl: parsed.data.imageUrl === "" ? null : parsed.data.imageUrl,
      name: parsed.data.name,
    });

    if (!success) {
      return { success: false, error: "Workflow not found or update failed" };
    }

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/workflows/[slug]", "page");
    revalidatePath("/[locale]/profile", "page");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update workflow",
    };
  }
}

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

/** Admin-only: upload a workflow avatar image */
export async function uploadWorkflowImageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  const workflowId = formData.get("workflowId");
  const file = formData.get("file");

  if (typeof workflowId !== "string" || !workflowId) {
    return { success: false, error: "Workflow ID is required" };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "No image file provided" };
  }

  const valRes = validateImageFile({ size: file.size, type: file.type });
  if (isErr(valRes)) {
    return { success: false, error: valRes.error.safeMessage };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const sanitizedExt = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)
      ? ext
      : "png";
    const path = `workflows/${workflowId}-${Date.now()}.${sanitizedExt}`;

    const uploadRes = await uploadPublicImage({
      bucket: "workflow-images",
      path,
      buffer,
      contentType: file.type || "image/png",
    });

    if (isErr(uploadRes)) {
      return { success: false, error: uploadRes.error.safeMessage };
    }

    const publicUrl = uploadRes.data.publicUrl;
    await updateWorkflowDetails(workflowId, { imageUrl: publicUrl });

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/workflows/[slug]", "page");
    revalidatePath("/[locale]/profile", "page");

    return { success: true, imageUrl: publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Image upload failed",
    };
  }
}
