import { NextRequest, NextResponse } from "next/server";
import { executeTestBenchWorkflow } from "@/lib/services/test-bench/runner";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db/queries/users";
import { z } from "zod";

const testBenchRunSchema = z.object({
  url: z.string().min(1),
  telegramId: z.number().optional(),
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
    const parsed = testBenchRunSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid URL or parameters provided" },
        { status: 400 }
      );
    }

    const trace = await executeTestBenchWorkflow({
      rawUrl: parsed.data.url,
      telegramId: parsed.data.telegramId,
    });

    return NextResponse.json(trace);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Test execution failed",
      },
      { status: 500 }
    );
  }
}
