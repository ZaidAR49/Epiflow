"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getUserById } from "@/lib/db/queries/users";
import {
  saveWorkflowChannelSchema,
  deleteWorkflowChannelSchema,
  type SaveWorkflowChannelInput,
  type DeleteWorkflowChannelInput,
} from "@/lib/validation/workflow-channels";
import {
  upsertWorkflowChannel,
  deleteWorkflowChannel,
  type WorkflowChannelItem,
} from "@/lib/db/queries/workflow-channels";

import { logger } from "@/lib/logger";

export async function saveWorkflowChannelAction(
  input: SaveWorkflowChannelInput
): Promise<{ success: boolean; channel?: WorkflowChannelItem; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    logger.warn("saveWorkflowChannelAction called without session");
    return { success: false, error: "Unauthorized: Please sign in" };
  }

  const caller = await getUserById(session.user.id);
  if (!caller || caller.role !== "admin" || caller.status === "locked") {
    logger.warn({ userId: session.user.id, role: caller?.role }, "Non-admin rejected from saveWorkflowChannelAction");
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  const parsed = saveWorkflowChannelSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Invalid channel parameters";
    logger.warn({ issues: parsed.error.issues, input }, "Invalid channel input");
    return { success: false, error: issue };
  }

  const { workflowId, channel, handle, isActive } = parsed.data;
  let url = parsed.data.url?.trim() || null;

  // Auto-generate canonical URL if omitted
  if (!url) {
    if (channel === "telegram") {
      url = `https://t.me/${handle}`;
    } else if (channel === "whatsapp") {
      const numeric = handle.replace(/[^0-9]/g, "");
      if (numeric) {
        url = `https://wa.me/${numeric}`;
      }
    }
  }

  try {
    logger.info({ workflowId, channel, handle, url, isActive }, "Upserting workflow channel");
    const channelItem = await upsertWorkflowChannel({
      workflowId,
      channel,
      handle,
      url,
      isActive,
    });

    if (!channelItem) {
      logger.error({ workflowId, channel }, "Failed to upsert workflow channel");
      return { success: false, error: "Failed to save workflow channel" };
    }

    revalidatePath("/en/admin", "page");
    revalidatePath("/ar/admin", "page");
    revalidatePath("/admin", "layout");
    revalidatePath("/profile", "layout");
    return { success: true, channel: channelItem };
  } catch (err) {
    logger.error({ err, workflowId, channel }, "Exception in saveWorkflowChannelAction");
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save workflow channel",
    };
  }
}

export async function deleteWorkflowChannelAction(
  input: DeleteWorkflowChannelInput
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please sign in" };
  }

  const caller = await getUserById(session.user.id);
  if (!caller || caller.role !== "admin" || caller.status === "locked") {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  const parsed = deleteWorkflowChannelSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid channel deletion parameters" };
  }

  try {
    const deleted = await deleteWorkflowChannel(
      parsed.data.channelId,
      parsed.data.workflowId
    );

    if (!deleted) {
      return { success: false, error: "Channel not found or already removed" };
    }

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/profile", "page");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete workflow channel",
    };
  }
}
