"use client";

import React from "react";
import type { WorkflowNode, NodeStatus } from "@/types/test-bench";
import {
  Send,
  Code,
  Database,
  GitBranch,
  Globe,
  Sparkles,
  Mail,
  FileDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  MinusCircle,
} from "lucide-react";

interface NodeCanvasProps {
  nodes: WorkflowNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

function getNodeIcon(category: WorkflowNode["category"], n8nType: string) {
  if (category === "trigger") return <Send className="h-3.5 w-3.5 text-sky-400" />;
  if (category === "auth") return <Database className="h-3.5 w-3.5 text-emerald-400" />;
  if (category === "routing") return <GitBranch className="h-3.5 w-3.5 text-indigo-400" />;
  if (category === "scraper") return <Globe className="h-3.5 w-3.5 text-amber-400" />;
  if (category === "ai") return <Sparkles className="h-3.5 w-3.5 text-purple-400" />;
  if (n8nType.includes("googleDrive")) return <FileDown className="h-3.5 w-3.5 text-blue-400" />;
  if (category === "email") return <Mail className="h-3.5 w-3.5 text-rose-400" />;
  return <Code className="h-3.5 w-3.5 text-slate-400" />;
}

function getStatusBadge(status: NodeStatus, durationMs?: number) {
  const baseBadge = "shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium border whitespace-nowrap";

  switch (status) {
    case "running":
      return (
        <span className={`${baseBadge} bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse`}>
          <Loader2 className="h-2.5 w-2.5 animate-spin shrink-0" />
          <span>Running</span>
        </span>
      );
    case "completed":
      return (
        <span className={`${baseBadge} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>
          <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
          <span>{durationMs !== undefined ? `${durationMs}ms` : "Done"}</span>
        </span>
      );
    case "failed":
      return (
        <span className={`${baseBadge} bg-rose-500/10 text-rose-400 border-rose-500/20`}>
          <AlertCircle className="h-2.5 w-2.5 shrink-0" />
          <span>Failed</span>
        </span>
      );
    case "skipped":
      return (
        <span className={`${baseBadge} bg-slate-500/10 text-slate-400 border-slate-500/20`}>
          <MinusCircle className="h-2.5 w-2.5 shrink-0" />
          <span>Skipped</span>
        </span>
      );
    default:
      return (
        <span className={`${baseBadge} bg-slate-800 text-slate-400 border-slate-700/50`}>
          <Clock className="h-2.5 w-2.5 shrink-0" />
          <span>Idle</span>
        </span>
      );
  }
}

export function NodeCanvas({
  nodes,
  selectedNodeId,
  onSelectNode,
}: NodeCanvasProps) {
  const tracks = [
    { title: "Stage 1 — Trigger & Gatekeeper", slice: nodes.slice(0, 5) },
    { title: "Stage 2 — URL Expansion & Apify Scrapers", slice: nodes.slice(5, 15) },
    { title: "Stage 3 — Data Extraction & Gemini AI", slice: nodes.slice(15, 19) },
    { title: "Stage 4 — Outreach Automation (Google Drive & Gmail)", slice: nodes.slice(19) },
  ];

  return (
    <div className="space-y-6">
      {tracks.map((track, trackIdx) => (
        <div
          key={trackIdx}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {track.title}
            </h3>
            <span className="text-xs text-[var(--text-muted)]">
              {track.slice.length} Nodes
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {track.slice.map((node) => {
              const isSelected = selectedNodeId === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  type="button"
                  className={`group relative flex flex-col justify-between rounded-lg border p-3 text-start transition-all overflow-hidden w-full ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--surface-2)] ring-1 ring-[var(--accent)] shadow-md"
                      : "border-[var(--border)] bg-[var(--bg)]/50 hover:border-slate-600 hover:bg-[var(--surface-2)]/60"
                  }`}
                >
                  <div className="w-full min-w-0">
                    <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--surface-2)] border border-[var(--border)]">
                          {getNodeIcon(node.category, node.n8nType)}
                        </div>
                        <span className="font-mono text-[10px] text-[var(--text-muted)] truncate min-w-0 flex-1">
                          {node.n8nType.replace("n8n-nodes-base.", "")}
                        </span>
                      </div>
                      <div className="shrink-0 ms-1">
                        {getStatusBadge(node.status, node.durationMs)}
                      </div>
                    </div>

                    <h4 className="mt-2.5 text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                      {node.name}
                    </h4>
                    <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {node.description}
                    </p>
                  </div>

                  {node.error && (
                    <div className="mt-2 w-full rounded bg-rose-500/10 p-1.5 text-xs text-rose-400 border border-rose-500/20 truncate">
                      {node.error}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
