"use client";

import React, { useEffect } from "react";
import { Mail, FileText, CheckCircle2, ExternalLink, Loader2, X } from "lucide-react";

interface EmailPromptModalProps {
  metadata: {
    role: string | null;
    company: string | null;
    hrName: string | null;
    hrEmail: string | null;
  };
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
  draftUrl?: string;
  isDrafting?: boolean;
}

export function EmailPromptModal({
  metadata,
  onConfirm,
  onDismiss,
  draftUrl,
  isDrafting,
}: EmailPromptModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDrafting) {
        onDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrafting, onDismiss]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 id="email-prompt-title" className="text-base font-bold text-[var(--text)]">
                Draft Outreach Email?
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Interactive Node: Ask to Draft Email
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            disabled={isDrafting}
            type="button"
            aria-label="Close"
            className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Role:</span>
            <span className="font-semibold text-[var(--text)]">{metadata.role ?? "Job Opportunity"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Company:</span>
            <span className="font-semibold text-[var(--text)]">{metadata.company ?? "Company"}</span>
          </div>
          {metadata.hrName && (
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Hiring Lead:</span>
              <span className="font-semibold text-[var(--text)]">{metadata.hrName}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--border)] pt-2">
            <span className="text-[var(--text-muted)]">Verified HR Email:</span>
            <span className="font-mono font-bold text-emerald-400">{metadata.hrEmail}</span>
          </div>
        </div>

        {draftUrl ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Gmail draft successfully composed with your CV attached!</span>
            </div>
            <a
              href={draftUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
            >
              <span>Open Draft in Gmail</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Clicking &quot;Yes&quot; triggers the Google Drive CV download node and generates a tailored Gmail draft with your resume attached.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={onConfirm}
                disabled={isDrafting}
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors disabled:opacity-50 shadow-sm"
              >
                {isDrafting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Downloading CV & Drafting...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5" />
                    <span>Yes, Draft with CV</span>
                  </>
                )}
              </button>
              <button
                onClick={onDismiss}
                disabled={isDrafting}
                type="button"
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors"
              >
                No, Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
