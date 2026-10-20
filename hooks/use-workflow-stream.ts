"use client";

import { useState, useCallback } from "react";
import { getInitialWorkflowNodes } from "@/lib/services/test-bench/initial-nodes";
import type {
  WorkflowNode,
  ExecutionLogItem,
  ChatMessage,
  SSEWorkflowEvent,
} from "@/types/test-bench";

export function useWorkflowStream() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(getInitialWorkflowNodes());
  const [logs, setLogs] = useState<ExecutionLogItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [syncToTelegram, setSyncToTelegram] = useState(true);

  // Email prompt state
  const [promptMetadata, setPromptMetadata] = useState<{
    role: string | null;
    company: string | null;
    hrName: string | null;
    hrEmail: string | null;
  } | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftUrl, setDraftUrl] = useState<string | undefined>(undefined);

  const resetAll = useCallback(() => {
    setNodes(getInitialWorkflowNodes());
    setLogs([]);
    setTotalDuration(null);
    setPromptMetadata(null);
    setDraftUrl(undefined);
  }, []);

  const runStream = useCallback(
    async (url: string) => {
      if (!url.trim() || isRunning) return;

      setIsRunning(true);
      setTotalDuration(null);
      setPromptMetadata(null);
      setDraftUrl(undefined);
      setNodes(getInitialWorkflowNodes());

      // Add user message to chat
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        sender: "user",
        text: url,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const response = await fetch("/api/test-bench/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            sendToTelegram: syncToTelegram,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Stream request failed: HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const event: SSEWorkflowEvent = JSON.parse(trimmed.slice(6));

              if (event.type === "node_start") {
                setNodes((prev) =>
                  prev.map((n) =>
                    n.id === event.nodeId
                      ? { ...n, status: "running", inputJson: event.inputJson }
                      : n
                  )
                );
              } else if (event.type === "node_finish") {
                setNodes((prev) =>
                  prev.map((n) => (n.id === event.node.id ? event.node : n))
                );
              } else if (event.type === "log") {
                setLogs((prev) => [...prev, event.log]);
              } else if (event.type === "chat_message") {
                setMessages((prev) => [...prev, event.message]);
              } else if (event.type === "chat_edit") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === event.messageId
                      ? {
                          ...m,
                          text: event.text,
                          replyMarkup: event.replyMarkup ?? m.replyMarkup,
                        }
                      : m
                  )
                );
              } else if (event.type === "email_prompt") {
                setPromptMetadata(event.metadata);
              } else if (event.type === "workflow_done") {
                setTotalDuration(event.trace.totalDurationMs);
              } else if (event.type === "error") {
                setLogs((prev) => [
                  ...prev,
                  {
                    id: `log_${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString(),
                    level: "error",
                    nodeId: "system",
                    message: event.message,
                  },
                ]);
              }
            } catch {
              // Ignore corrupted chunks
            }
          }
        }
      } catch (error) {
        setLogs((prev) => [
          ...prev,
          {
            id: `log_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            level: "error",
            nodeId: "system",
            message:
              error instanceof Error
                ? error.message
                : "Stream connection error",
          },
        ]);
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, syncToTelegram]
  );

  const executeDraft = useCallback(
    async (metadata?: {
      role?: string | null;
      company?: string | null;
      hrName?: string | null;
      hrEmail?: string | null;
    }) => {
      const activeMeta = metadata || promptMetadata;
      if (!activeMeta?.hrEmail || isDrafting) return;

      setIsDrafting(true);

      // Add user confirmation to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `user_confirm_${Date.now()}`,
          sender: "user",
          text: "نعم، يرجى تجهيز مسودة البريد مع سيرتي الذاتية ✅",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      try {
        const res = await fetch("/api/test-bench/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: activeMeta.role || "Software Role",
            company: activeMeta.company || "Company",
            hrName: activeMeta.hrName,
            hrEmail: activeMeta.hrEmail,
          }),
        });

        const data = await res.json();
        if (data.draftUrl) {
          setDraftUrl(data.draftUrl);
          setMessages((prev) => [
            ...prev,
            {
              id: `bot_draft_ready_${Date.now()}`,
              sender: "bot",
              text: `✅ **تم تجهيز مسودة البريد الإلكتروني في Gmail بنجاح مع إرفاق سيرتك الذاتية!**\n\nيمكنك مراجعتها وتعديلها عبر الرابط التالي:\n${data.draftUrl}`,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        }
        if (data.nodes) {
          setNodes((prev) =>
            prev.map((n) => {
              const updated = data.nodes.find(
                (un: WorkflowNode) => un.id === n.id
              );
              return updated ? updated : n;
            })
          );
        }
        if (data.logs) {
          setLogs((prev) => [...prev, ...data.logs]);
        }
      } catch {
        setLogs((prev) => [
          ...prev,
          {
            id: `log_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            level: "error",
            nodeId: "node_create_gmail_draft",
            message: "Failed to generate Gmail draft with CV",
          },
        ]);
      } finally {
        setIsDrafting(false);
      }
    },
    [promptMetadata, isDrafting]
  );

  return {
    nodes,
    logs,
    messages,
    isRunning,
    totalDuration,
    syncToTelegram,
    setSyncToTelegram,
    promptMetadata,
    setPromptMetadata,
    isDrafting,
    draftUrl,
    runStream,
    executeDraft,
    resetAll,
    clearLogs: () => setLogs([]),
    clearMessages: () => setMessages([]),
  };
}
