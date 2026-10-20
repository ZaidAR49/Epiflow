"use server";

import { auth } from "@/auth";
import { deleteWorkflowCredential } from "@/lib/db/queries/credentials";
import { ErrorCodes } from "@/lib/errors";

export interface DisconnectActionResult {
  success: boolean;
  errorCode?: string;
  message?: string;
}

export async function disconnectWorkflowCredentialAction(
  workflowSlug: string,
  provider: string = "google"
): Promise<DisconnectActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHORIZED,
      message: "You must be signed in to disconnect credentials",
    };
  }

  try {
    const deleted = await deleteWorkflowCredential(
      session.user.id,
      workflowSlug,
      provider
    );

    if (!deleted) {
      return {
        success: false,
        errorCode: "NOT_FOUND",
        message: "No active credential found to disconnect",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: "An unexpected error occurred while disconnecting credential",
    };
  }
}
