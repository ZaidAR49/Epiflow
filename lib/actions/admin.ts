"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  updateWorkflowDetails,
  updateUserRoleAndStatus,
  updateUserWorkflowQuota,
} from "@/lib/db/queries/admin";
import {
  validateImageFile,
  uploadPublicImage,
} from "@/lib/services/storage/supabase-storage";
import { isErr } from "@/lib/result";

const updateWorkflowSchema = z.object({
  workflowId: z.string().uuid(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().or(z.literal("")).nullable().optional(),
  name: z.string().min(1).max(100).optional(),
});

const updateUserStatusSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "user", "guest"]).optional(),
  status: z.enum(["pending", "approved", "rejected", "locked"]).optional(),
});

const updateUserQuotaSchema = z.object({
  userId: z.string().uuid(),
  workflowSlug: z.string().default("job-xray"),
  usageLimit: z.number().int().min(0).nullable().optional(),
  resetCount: z.boolean().optional(),
});

export async function updateWorkflowAction(input: z.infer<typeof updateWorkflowSchema>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
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

export async function updateUserStatusAction(input: z.infer<typeof updateUserStatusSchema>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  const parsed = updateUserStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid user update parameters" };
  }

  if (
    parsed.data.userId === session.user.id &&
    parsed.data.role &&
    parsed.data.role !== "admin"
  ) {
    return { success: false, error: "You cannot revoke your own admin role" };
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

export async function updateUserQuotaAction(input: z.infer<typeof updateUserQuotaSchema>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
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
