"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { NodeCanvas } from "@/components/features/test-bench/node-canvas";
import { NodeInspector } from "@/components/features/test-bench/node-inspector";
import { TerminalLogs } from "@/components/features/test-bench/terminal-logs";
import { BrowserChat } from "@/components/features/test-bench/browser-chat";
import { EmailPromptModal } from "@/components/features/test-bench/email-prompt-modal";
import {
  TestBenchControls,
  TEST_BENCH_PRESETS,
} from "@/components/features/test-bench/test-bench-controls";
import { useWorkflowStream } from "@/hooks/use-workflow-stream";

export default function TestWorkflowPage() {
  const [url, setUrl] = useState(TEST_BENCH_PRESETS[1]?.url ?? "");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("node_trigger");
  const [viewMode, setViewMode] = useState<"split" | "canvas" | "chat">("split");

  const {
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
    clearLogs,
    clearMessages,
  } = useWorkflowStream();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const completedCount = nodes.filter((n) => n.status === "completed").length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <TestBenchControls
          url={url}
          onUrlChange={setUrl}
          isRunning={isRunning}
          onRun={() => runStream(url)}
          onReset={resetAll}
          totalNodes={nodes.length}
          completedNodes={completedCount}
          totalLogs={logs.length}
          durationMs={totalDuration}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* View Mode Switching */}
        {viewMode === "split" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <NodeCanvas
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={(id) => setSelectedNodeId(id)}
              />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <BrowserChat
                messages={messages}
                inputUrl={url}
                onInputChange={setUrl}
                onSendMessage={(customUrl) => runStream(customUrl || url)}
                onButtonClick={(action, meta) => {
                  if (action === "yes") {
                    executeDraft(meta);
                  }
                }}
                onClear={clearMessages}
                isRunning={isRunning}
                syncToTelegram={syncToTelegram}
                onToggleSyncToTelegram={setSyncToTelegram}
              />
              <NodeInspector
                node={selectedNode}
                onClose={() => setSelectedNodeId(null)}
              />
            </div>
          </div>
        )}

        {viewMode === "canvas" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <NodeCanvas
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={(id) => setSelectedNodeId(id)}
              />
            </div>
            <div className="lg:col-span-4">
              <div className="sticky top-20">
                <NodeInspector
                  node={selectedNode}
                  onClose={() => setSelectedNodeId(null)}
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === "chat" && (
          <div className="mx-auto max-w-3xl">
            <BrowserChat
              messages={messages}
              inputUrl={url}
              onInputChange={setUrl}
              onSendMessage={(customUrl) => runStream(customUrl || url)}
              onButtonClick={(action, meta) => {
                if (action === "yes") {
                  executeDraft(meta);
                }
              }}
              onClear={clearMessages}
              isRunning={isRunning}
              syncToTelegram={syncToTelegram}
              onToggleSyncToTelegram={setSyncToTelegram}
            />
          </div>
        )}

        {/* Real-time Streaming Logs Terminal */}
        <TerminalLogs logs={logs} onClear={clearLogs} />
      </main>

      {/* Interactive Email Draft Prompt Modal */}
      {promptMetadata && (
        <EmailPromptModal
          metadata={promptMetadata}
          onConfirm={() => executeDraft(promptMetadata)}
          onDismiss={() => setPromptMetadata(null)}
          draftUrl={draftUrl}
          isDrafting={isDrafting}
        />
      )}
    </div>
  );
}
