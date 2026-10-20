import { NextRequest } from "next/server";
import { executeStreamWorkflow } from "@/lib/services/test-bench/stream-runner";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db/queries/users";
import { z } from "zod";

const streamRequestSchema = z.object({
  url: z.string().min(1),
  telegramId: z.number().optional(),
  sendToTelegram: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Please sign in" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const caller = await getUserById(session.user.id);
    if (!caller || caller.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin privileges required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: unknown = await req.json();
    const parsed = streamRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { url, telegramId, sendToTelegram } = parsed.data;
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    executeStreamWorkflow({
      rawUrl: url,
      telegramId,
      sendToTelegram: sendToTelegram ?? true,
      onEvent: async (event) => {
        const payload = `data: ${JSON.stringify(event)}\n\n`;
        await writer.write(encoder.encode(payload));
      },
    })
      .catch(async (error) => {
        const errPayload = `data: ${JSON.stringify({
          type: "error",
          message: error instanceof Error ? error.message : "Stream error",
        })}\n\n`;
        await writer.write(encoder.encode(errPayload));
      })
      .finally(async () => {
        await writer.close();
      });

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
