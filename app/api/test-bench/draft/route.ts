import { NextRequest, NextResponse } from "next/server";
import { executeTestBenchDraftBranch } from "@/lib/services/test-bench/draft-runner";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db/queries/users";
import { z } from "zod";

const testBenchDraftSchema = z.object({
  role: z.string(),
  company: z.string(),
  hrName: z.string().nullable().optional(),
  hrEmail: z.string().email(),
  telegramId: z.number().optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    const caller = await getUserById(session.user.id);
    if (!caller || caller.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const body: unknown = await req.json();
    const parsed = testBenchDraftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email payload parameters" },
        { status: 400 }
      );
    }

    const result = await executeTestBenchDraftBranch({
      ...parsed.data,
      userId: session.user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Draft branch failed",
      },
      { status: 500 }
    );
  }
}
