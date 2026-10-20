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

export async function updateWorkflowAction(input: UpdateWorkflowInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please sign in" };
  }

  const caller = await getUserById(session.user.id);
  if (!caller || caller.role !== "admin" || caller.status === "locked") {
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

export async function updateUserStatusAction(input: UpdateUserStatusInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please sign in" };
  }

  const parsed = updateUserStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid user update parameters" };
  }

  const caller = await getUserById(session.user.id);
  if (!caller || caller.role !== "admin" || caller.status === "locked") {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  const target = await getUserById(parsed.data.userId);
  if (!target) {
    return { success: false, error: "User not found" };
  }

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

export async function deleteUserAction(input: DeleteUserInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please sign in" };
  }

  const parsed = deleteUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid user deletion parameters" };
  }

  const caller = await getUserById(session.user.id);
  if (!caller || caller.role !== "admin" || caller.status === "locked") {
    return { success: false, error: "Unauthorized: Admin privileges required" };
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

export async function updateUserQuotaAction(input: UpdateUserQuotaInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please sign in" };
  }

  const caller = await getUserById(session.user.id);
  if (!caller || caller.role !== "admin" || caller.status === "locked") {
    return { success: false, error: "Unauthorized: Admin privileges required" };
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
