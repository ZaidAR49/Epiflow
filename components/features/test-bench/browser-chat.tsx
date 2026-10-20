"use client";

import React, { useRef, useEffect, useState } from "react";
import type { ChatMessage, ChatButton } from "@/types/test-bench";
import { Send, Bot, User, Trash2, Loader2, Smartphone, Maximize2, Minimize2 } from "lucide-react";
import { ChatMarkdown } from "./chat-markdown";

interface BrowserChatProps {
  messages: ChatMessage[];
  inputUrl: string;
  onInputChange: (val: string) => void;
  onSendMessage: (url?: string) => void;
  onButtonClick: (action: ChatButton["action"], metadata?: ChatMessage["metadata"]) => void;
  onClear: () => void;
  isRunning: boolean;
  syncToTelegram: boolean;
  onToggleSyncToTelegram: (val: boolean) => void;
  heightClass?: string;
  allowZoom?: boolean;
}

export function BrowserChat({
  messages,
  inputUrl,
  onInputChange,
  onSendMessage,
  onButtonClick,
  onClear,
  isRunning,
  syncToTelegram,
  onToggleSyncToTelegram,
  heightClass = "h-[560px]",
  allowZoom = true,
}: BrowserChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isRunning]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isRunning && inputUrl.trim()) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const containerClasses = isZoomed
    ? "fixed inset-4 sm:inset-10 z-50 flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    : `flex flex-col ${heightClass} rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden transition-all`;

  return (
    <>
      {isZoomed && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={() => setIsZoomed(false)}
        />
      )}

      <div className={containerClasses}>
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white shadow-sm">
              <Bot className="h-4 w-4" />
              <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--surface)]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--text)]">JobPost X-Ray Bot</h3>
              <span className="text-[10px] text-emerald-400 font-medium">Online & Ready</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={syncToTelegram}
                onChange={(e) => onToggleSyncToTelegram(e.target.checked)}
                className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-0"
              />
              <Smartphone className="h-3 w-3" />
              <span className="hidden sm:inline">Telegram Sync</span>
            </label>

            {allowZoom && (
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                type="button"
                className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
                title={isZoomed ? "Minimize" : "Maximize Full Size"}
              >
                {isZoomed ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            )}

            <button
              onClick={onClear}
              type="button"
              className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
              title="Clear Messages"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[var(--text-muted)]">
            <Bot className="h-8 w-8 text-[var(--accent)]/50 mb-2" />
            <p className="font-semibold text-xs text-[var(--text)]">Telegram In-Browser Simulator</p>
            <p className="mt-1 text-[11px] max-w-xs">
              Paste a LinkedIn post URL below to watch the live bot interaction, analysis report, and CV draft prompt in real-time.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isBot = msg.sender === "bot";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isBot ? "justify-start" : "justify-end"}`}
              >
                {isBot && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                    isBot
                      ? "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] rounded-ss-xs"
                      : "bg-[var(--accent)] text-white rounded-se-xs"
                  }`}
                >
                  <ChatMarkdown content={msg.text} />

                  {/* Inline interactive buttons */}
                  {msg.replyMarkup?.buttons && (
                    <div className="mt-2.5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-2">
                      {msg.replyMarkup.buttons.map((btn, bIdx) => (
                        <button
                          key={bIdx}
                          onClick={() => onButtonClick(btn.action, msg.metadata)}
                          type="button"
                          className="flex items-center gap-1.5 rounded-lg bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent)] hover:text-white border border-[var(--border)] transition-colors shadow-xs"
                        >
                          <span>{btn.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`mt-1 text-[9px] ${
                      isBot ? "text-[var(--text-muted)]" : "text-white/70"
                    } text-end`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {!isBot && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-slate-300 border border-slate-700 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isRunning && (
          <div className="flex items-center gap-2 text-[var(--text-muted)] italic text-[11px] ps-8">
            <Loader2 className="h-3 w-3 animate-spin text-[var(--accent)]" />
            <span>Bot is executing workflow nodes...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="border-t border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste LinkedIn URL (e.g. https://www.linkedin.com/posts/...)"
            disabled={isRunning}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => onSendMessage()}
            disabled={isRunning || !inputUrl.trim()}
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 shadow-sm shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </>
);
}
