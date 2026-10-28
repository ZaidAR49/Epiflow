"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  updateWorkflowSchema,
  type UpdateWorkflowInput,
} from "@/lib/validation/admin";
import { updateWorkflowDetails } from "@/lib/db/queries/admin";
import { getUserById } from "@/lib/db/queries/users";
import {
  validateImageFile,
  uploadPublicImage,
} from "@/lib/services/storage/supabase-storage";
import { isErr } from "@/lib/result";

async function verifyAdminCaller() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Unauthorized: Please sign in" };
  }
  const caller = await getUserById(session.user.id);
  if (!caller || caller.role !== "admin" || caller.status === "locked") {
    return { ok: false as const, error: "Unauthorized: Admin privileges required" };
  }
  return { ok: true as const, callerId: session.user.id };
}

/** Admin-only: update workflow details (name, active state, image URL) */
export async function updateWorkflowAction(input: UpdateWorkflowInput) {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

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

/** Admin-only: upload a workflow avatar image */
export async function uploadWorkflowImageAction(formData: FormData) {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  const workflowId = formData.get("workflowId");
  const file = formData.get("file");

  if (typeof workflowId !== "string" || !workflowId) {
    return { success: false, error: "Workflow ID is required" };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "No image file provided" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const valRes = validateImageFile({
      size: file.size,
      type: file.type,
      buffer,
    });
    if (isErr(valRes)) {
      return { success: false, error: valRes.error.safeMessage };
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const sanitizedExt = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)
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

