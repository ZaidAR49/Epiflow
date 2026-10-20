"use client";

import React, { useState } from "react";
import type { WorkflowNode } from "@/types/test-bench";
import { Copy, Check, X, Code, Terminal, Clock } from "lucide-react";

interface NodeInspectorProps {
  node: WorkflowNode | null;
  onClose: () => void;
}

export function NodeInspector({ node, onClose }: NodeInspectorProps) {
  const [activeTab, setActiveTab] = useState<"output" | "input" | "details">("output");
  const [copied, setCopied] = useState(false);

  if (!node) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <Code className="h-10 w-10 text-[var(--text-muted)] opacity-40 mb-3" />
        <h4 className="text-sm font-semibold text-[var(--text)]">Node Inspector</h4>
        <p className="mt-1 text-xs text-[var(--text-muted)] max-w-xs">
          Click any node in the canvas above to inspect its real-time input and output JSON payloads.
        </p>
      </div>
    );
  }

  const jsonToCopy =
    activeTab === "input"
      ? JSON.stringify(node.inputJson, null, 2)
      : JSON.stringify(node.outputJson, null, 2);

  const handleCopy = () => {
    if (jsonToCopy) {
      navigator.clipboard.writeText(jsonToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 bg-[var(--surface-2)]/50">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-sm font-bold text-[var(--text)] truncate max-w-[220px]">
            {node.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Meta Bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-2 text-xs bg-[var(--bg)]/30">
        <span className="font-mono text-[var(--text-muted)]">{node.n8nType}</span>
        <span className="text-[var(--text-muted)]">•</span>
        <div className="flex items-center gap-1 text-[var(--text-muted)]">
          <Clock className="h-3 w-3" />
          <span>{node.durationMs !== undefined ? `${node.durationMs}ms` : "idle"}</span>
        </div>
        <span className="text-[var(--text-muted)]">•</span>
        <span
          className={`capitalize font-medium ${
            node.status === "completed"
              ? "text-emerald-400"
              : node.status === "running"
              ? "text-amber-400"
              : node.status === "failed"
              ? "text-rose-400"
              : "text-slate-400"
          }`}
        >
          {node.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-1.5 bg-[var(--surface)]">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("output")}
            type="button"
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === "output"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Output JSON
          </button>
          <button
            onClick={() => setActiveTab("input")}
            type="button"
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === "input"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Input JSON
          </button>
          <button
            onClick={() => setActiveTab("details")}
            type="button"
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === "details"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Info
          </button>
        </div>

        {activeTab !== "details" && jsonToCopy && (
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 max-h-[360px] min-h-[220px] overflow-auto font-mono text-xs">
        {activeTab === "details" ? (
          <div className="space-y-3 font-sans text-xs">
            <div>
              <span className="text-[var(--text-muted)]">Description:</span>
              <p className="mt-1 text-[var(--text)]">{node.description}</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">n8n Node Type:</span>
              <p className="mt-1 font-mono text-[var(--accent)]">{node.n8nType}</p>
            </div>
            {node.error && (
              <div className="rounded border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400">
                <span className="font-bold">Error:</span> {node.error}
              </div>
            )}
          </div>
        ) : (
          <pre className="text-[var(--text)] whitespace-pre-wrap break-all leading-relaxed">
            {jsonToCopy || "// No data available yet"}
          </pre>
        )}
      </div>
    </div>
  );
}
