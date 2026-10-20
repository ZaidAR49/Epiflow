"use client";

import React, { useRef, useEffect } from "react";
import type { ExecutionLogItem } from "@/types/test-bench";
import { Terminal, Trash2, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface TerminalLogsProps {
  logs: ExecutionLogItem[];
  onClear: () => void;
}

export function TerminalLogs({ logs, onClear }: TerminalLogsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  function getLogIcon(level: ExecutionLogItem["level"]) {
    switch (level) {
      case "success":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case "warn":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case "error":
        return <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />;
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#070b12] shadow-inner overflow-hidden flex flex-col h-[280px]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 text-[var(--text)]">
          <Terminal className="h-4 w-4 text-[var(--accent)]" />
          <span className="font-semibold">Live Execution Logs</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
            {logs.length} events
          </span>
        </div>
        <button
          onClick={onClear}
          type="button"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Logs container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 select-text"
      >
        {logs.length === 0 ? (
          <div className="text-[var(--text-muted)] italic">
            No execution events yet. Click &quot;Run Full Workflow&quot; above to start...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
              {getLogIcon(log.level)}
              <span className="text-[var(--text-muted)] shrink-0 select-none">
                [{log.timestamp}]
              </span>
              <span className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] text-slate-300 font-semibold shrink-0">
                {log.nodeId.replace("node_", "")}
              </span>
              <span
                className={`${
                  log.level === "error"
                    ? "text-rose-400 font-medium"
                    : log.level === "warn"
                    ? "text-amber-400"
                    : log.level === "success"
                    ? "text-emerald-300"
                    : "text-[var(--text)]"
                }`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
