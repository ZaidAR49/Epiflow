import "server-only";
import { AppError, ErrorCodes } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import { getUserById } from "@/lib/db/queries/users";
import {
  getUserWorkflowDetails,
  type UserWorkflowProfile,
} from "@/lib/db/queries/access";

export interface WebGatekeeperAuth {
  user: NonNullable<Awaited<ReturnType<typeof getUserById>>>;
  workflow: UserWorkflowProfile;
}

/**
 * Gatekeeper verification for web user requests (analagous to authenticate_gatekeeper in PostgreSQL).
 * Enforces account status (approved), active non-expired access grant, and quota limits.
 */
export async function authenticateWebGatekeeper(
  userId: string,
  workflowSlug: string = "job-xray"
): Promise<Result<WebGatekeeperAuth, AppError>> {
  const [user, workflow] = await Promise.all([
    getUserById(userId),
    getUserWorkflowDetails(userId, workflowSlug),
  ]);

  if (!user) {
    return err(
      new AppError(
        ErrorCodes.UNREGISTERED,
        401,
        "User account not found. Please register or sign in."
      )
    );
  }

  if (user.status === "locked") {
    return err(
      new AppError(
        ErrorCodes.ACCOUNT_LOCKED,
        423,
        "Your account has been locked. Please contact support."
      )
    );
  }

  if (user.status === "pending") {
    return err(
      new AppError(
        ErrorCodes.ACCOUNT_PENDING,
        403,
        "Your account access request is pending administrator approval."
      )
    );
  }

  if (user.status === "rejected") {
    return err(
      new AppError(
        ErrorCodes.ACCOUNT_REJECTED,
        403,
        "Your access request has been declined. Please contact support."
      )
    );
  }

  if (!workflow) {
    return err(
      new AppError(
        ErrorCodes.WORKFLOW_FORBIDDEN,
        403,
        "You do not have access permissions for this workflow."
      )
    );
  }

  if (workflow.expiresAt && workflow.expiresAt.getTime() < Date.now()) {
    return err(
      new AppError(
        ErrorCodes.ACCESS_EXPIRED,
        403,
        "Your access subscription or grant for this workflow has expired."
      )
    );
  }

  if (
    workflow.usageLimit !== null &&
    workflow.usageCount >= workflow.usageLimit
  ) {
    return err(
      new AppError(
        ErrorCodes.QUOTA_EXCEEDED,
        403,
        "Workflow usage quota exceeded for this billing cycle."
      )
    );
  }

  return ok({ user, workflow });
}

