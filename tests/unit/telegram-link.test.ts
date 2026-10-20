import { describe, it, expect, vi, beforeEach } from "vitest";
import { manualTelegramLinkSchema } from "@/lib/validation/telegram-link";
import { isTelegramCommand } from "@/lib/services/telegram/command-handler";
import {
  generateTelegramLinkTokenAction,
  linkTelegramManuallyAction,
  disconnectTelegramAction,
} from "@/lib/actions/telegram-link";

// Mock dependencies
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/db/queries/users", () => ({
  linkTelegramToUser: vi.fn(),
  unlinkTelegramFromUser: vi.fn(),
  getUserById: vi.fn(),
  getUserByTelegramId: vi.fn(),
}));

vi.mock("@/lib/db/queries/telegram-link", () => ({
  saveTelegramLinkToken: vi.fn(),
  verifyAndConsumeTelegramLinkToken: vi.fn(),
}));

vi.mock("@/lib/db/queries/workflow-channels", () => ({
  getWorkflowChannelBySlug: vi.fn(),
}));

describe("Telegram Account Linking Validation & Commands", () => {
  it("validates valid numeric telegram IDs and cleans leading @ from usernames", () => {
    const input = {
      telegramId: "2076665816",
      username: "@my_bot_user",
    };

    const parsed = manualTelegramLinkSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.telegramId).toBe(2076665816);
      expect(parsed.data.username).toBe("my_bot_user");
    }
  });

  it("handles optional or omitted username in manual schema", () => {
    const input = {
      telegramId: 987654321,
    };

    const parsed = manualTelegramLinkSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.telegramId).toBe(987654321);
      expect(parsed.data.username).toBeNull();
    }
  });

  it("rejects non-numeric, negative or zero telegram IDs", () => {
    expect(manualTelegramLinkSchema.safeParse({ telegramId: "not-a-number" }).success).toBe(false);
    expect(manualTelegramLinkSchema.safeParse({ telegramId: -50 }).success).toBe(false);
    expect(manualTelegramLinkSchema.safeParse({ telegramId: 0 }).success).toBe(false);
  });

  it("identifies slash commands correctly", () => {
    expect(isTelegramCommand("/start")).toBe(true);
    expect(isTelegramCommand("/connect 12345")).toBe(true);
    expect(isTelegramCommand("/help")).toBe(true);
    expect(isTelegramCommand("https://linkedin.com/posts/123")).toBe(false);
    expect(isTelegramCommand("Hello bot")).toBe(false);
  });

  it("parses account link tokens from /start and /connect variations", () => {
    const token = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
    const pattern = /^\/(?:start\s+connect_|connect\s+connect_|connect\s+)([a-f0-9]+)$/i;

    const match1 = `/start connect_${token}`.match(pattern);
    expect(match1?.[1]).toBe(token);

    const match2 = `/connect connect_${token}`.match(pattern);
    expect(match2?.[1]).toBe(token);

    const match3 = `/connect ${token}`.match(pattern);
    expect(match3?.[1]).toBe(token);

    const matchInvalid = `/start some_random_text`.match(pattern);
    expect(matchInvalid).toBeNull();
  });
});

import { auth } from "@/auth";
import { saveTelegramLinkToken } from "@/lib/db/queries/telegram-link";
import { getWorkflowChannelBySlug } from "@/lib/db/queries/workflow-channels";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockSaveToken = saveTelegramLinkToken as unknown as ReturnType<typeof vi.fn>;
const mockGetChannel = getWorkflowChannelBySlug as unknown as ReturnType<typeof vi.fn>;

describe("Telegram Link Server Actions Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects generateTelegramLinkTokenAction if user is not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await generateTelegramLinkTokenAction();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("UNAUTHORIZED");
    }
  });

  it("rejects linkTelegramManuallyAction if user is not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await linkTelegramManuallyAction({ telegramId: 12345 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("UNAUTHORIZED");
    }
  });

  it("rejects disconnectTelegramAction if user is not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await disconnectTelegramAction();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("UNAUTHORIZED");
    }
  });

  it("successfully generates 1-click deep link when bot channel is configured", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-123", email: "test@example.com" },
      expires: "2099-01-01",
    });

    mockSaveToken.mockResolvedValueOnce(true);
    mockGetChannel.mockResolvedValueOnce({
      id: "chan-1",
      workflowId: "wf-1",
      channel: "telegram",
      handle: "JobPostXRayBot",
      url: "https://t.me/JobPostXRayBot",
      isActive: true,
      createdAt: new Date(),
    });

    const result = await generateTelegramLinkTokenAction();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.botHandle).toBe("JobPostXRayBot");
      expect(result.data.deepLink).toContain("https://t.me/JobPostXRayBot?start=connect_");
      expect(result.data.command).toContain("/connect ");
    }
  });
});
