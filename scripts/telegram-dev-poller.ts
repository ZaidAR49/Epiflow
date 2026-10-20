import process from "node:process";

// Automatically load .env.local in development
try {
  process.loadEnvFile(".env.local");
} catch {
  // Ignore if not present
}

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const secretToken = process.env.TELEGRAM_BOT_SECRET_TOKEN || "";
const webhookTarget = process.env.LOCAL_WEBHOOK_URL || "http://localhost:3000/api/telegram/webhook";

if (!botToken) {
  console.error("❌ TELEGRAM_BOT_TOKEN is missing in .env.local");
  process.exit(1);
}

console.log("🤖 Starting Telegram Local Development Poller...");
console.log(`📡 Forwarding updates to: ${webhookTarget}`);

let offset = 0;

async function pollUpdates() {
  while (true) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (!res.ok) {
        console.warn(`[Poller] Telegram returned HTTP ${res.status}. Retrying in 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      const data = await res.json();
      if (!data.ok || !Array.isArray(data.result)) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      for (const update of data.result) {
        offset = update.update_id + 1;
        const sender = update.message?.from?.username || update.callback_query?.from?.username || "unknown";
        const text = update.message?.text || update.callback_query?.data || "[non-text]";
        console.log(`[Poller] Received update #${update.update_id} from @${sender}: ${text}`);

        // Forward update to the local Next.js webhook route
        try {
          const forwardRes = await fetch(webhookTarget, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-telegram-bot-api-secret-token": secretToken,
            },
            body: JSON.stringify(update),
          });

          if (!forwardRes.ok) {
            console.error(`[Poller] Webhook returned HTTP ${forwardRes.status}`);
          }
        } catch (err) {
          console.error("[Poller] Error forwarding update to local Next.js server:", err);
        }
      }
    } catch (error) {
      console.error("[Poller] Polling connection error:", error);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

pollUpdates();
