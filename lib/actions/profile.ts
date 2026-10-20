"use server";

import { auth } from "@/auth";
import { profileUpdateSchema, workflowMetadataSchema } from "@/lib/validation/profile";
import { updateUserProfile } from "@/lib/db/queries/users";
import { updateUserWorkflowMetadata } from "@/lib/db/queries/access";
import { ErrorCodes } from "@/lib/errors";

export type ProfileActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; errorCode: string; message: string };

/**
 * Server action to update user profile information (name, language).
 * Enforces ownership: only mutates session.user.id.
 */
export async function updateProfileAction(
  rawInput: unknown
): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHORIZED,
      message: "You must be signed in to perform this action",
    };
  }

  const parsed = profileUpdateSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      errorCode: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message || "Invalid input data",
    };
  }

  try {
    const updated = await updateUserProfile(session.user.id, parsed.data);
    if (!updated) {
      return {
        success: false,
        errorCode: "NOT_FOUND",
        message: "User account could not be found",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: "Failed to update profile",
    };
  }
}

/**
 * Server action to update job-xray workflow metadata preferences (fullName, cv, sendEmail).
 * Enforces ownership: only mutates session.user.id.
 */
export async function updateWorkflowSettingsAction(
  rawInput: unknown
): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHORIZED,
      message: "You must be signed in to perform this action",
    };
  }

  const parsed = workflowMetadataSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      errorCode: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message || "Invalid workflow settings",
    };
  }

  try {
    const ok = await updateUserWorkflowMetadata(
      session.user.id,
      "job-xray",
      parsed.data
    );

    if (!ok) {
      return {
        success: false,
        errorCode: "UPDATE_FAILED",
        message: "Failed to update workflow preferences",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: "An unexpected error occurred while saving settings",
    };
  }
}
