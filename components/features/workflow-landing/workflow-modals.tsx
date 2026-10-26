"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { PresetData } from "./types";

interface WorkflowModalsProps {
  isGmailModalOpen: boolean;
  isCuratorModalOpen: boolean;
  onCloseGmailModal: () => void;
  onCloseCuratorModal: () => void;
  onCopyCuratorMarkdown: () => void;
  onSelectPaidPlan: (planName: string) => void;
  activePreset: PresetData;
  toastMessage: string | null;
}

export function WorkflowModals({
  isGmailModalOpen,
  isCuratorModalOpen,
  onCloseGmailModal,
  onCloseCuratorModal,
  onCopyCuratorMarkdown,
  onSelectPaidPlan,
  activePreset,
  toastMessage,
}: WorkflowModalsProps) {
  const t = useTranslations("workflowLanding");

  React.useEffect(() => {
    if (!isGmailModalOpen && !isCuratorModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isGmailModalOpen) onCloseGmailModal();
        if (isCuratorModalOpen) onCloseCuratorModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGmailModalOpen, isCuratorModalOpen, onCloseGmailModal, onCloseCuratorModal]);

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 end-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg surface-raised border border-[var(--accent)]/40 font-mono text-xs text-[var(--text)] shadow-xl animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Gmail Draft Preview Modal */}
      {isGmailModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("modalGmailHeader")}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--bg)]/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col surface-card rounded-xl overflow-hidden shadow-2xl text-start min-w-0">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[var(--bg)] border-b hairline-border flex items-center justify-between shrink-0">
              <span className="font-mono text-xs text-[var(--accent)] font-semibold truncate">
                {t("modalGmailHeader")}
              </span>
              <button
                type="button"
                onClick={onCloseGmailModal}
                className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors shrink-0 ms-2"
              >
                {t("modalCloseEsc")}
              </button>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 space-y-4 text-sm overflow-y-auto">
              <div className="p-3.5 sm:p-4 rounded-lg bg-[var(--bg)] border hairline-border font-mono text-xs space-y-2 break-all">
                <div>
                  <span className="text-[var(--text-muted)]">{t("modalToLabel")}</span>
                  <span className="text-emerald-400 ms-1">{activePreset.draftTo}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{t("modalSubjectLabel")}</span>
                  <span className="text-[var(--text)] ms-1">{activePreset.draftSubject}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{t("modalDriveLabel")}</span>
                  <span className="text-[var(--accent)] ms-1">Google_Drive_Resume_2026.pdf</span>
                </div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-lg bg-[var(--bg)] border hairline-border text-[var(--text-muted)] leading-relaxed text-xs sm:text-sm break-words whitespace-pre-wrap">
                {activePreset.draftBody}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCloseGmailModal}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg surface-raised text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  {t("modalClosePreview")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCloseGmailModal();
                    onSelectPaidPlan("Gmail Sync Add-on");
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium flex items-center justify-center gap-2"
                >
                  <span>{t("modalUnlockGmail")}</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[9px] uppercase font-semibold">
                    {t("comingSoonBadge")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Curator Channel Post Preview Modal */}
      {isCuratorModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("modalCuratorHeader")}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--bg)]/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col surface-card rounded-xl overflow-hidden shadow-2xl text-start min-w-0">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[var(--bg)] border-b hairline-border flex items-center justify-between shrink-0">
              <span className="font-mono text-xs text-emerald-400 font-semibold truncate">
                {t("modalCuratorHeader")}
              </span>
              <button
                type="button"
                onClick={onCloseCuratorModal}
                className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-hidden transition-colors shrink-0 ms-2"
              >
                {t("modalCloseEsc")}
              </button>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 space-y-4 text-sm overflow-y-auto">
              <p className="text-xs text-[var(--text-muted)] break-words">
                {t("modalCuratorDesc")}
              </p>
              <pre className="p-3.5 sm:p-4 rounded-lg bg-[var(--bg)] border hairline-border font-mono text-xs text-[var(--text)] whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
{`## ${activePreset.role} — ${activePreset.locations}
----------------------------------------
Location: ${activePreset.metaLine}

Role Summary:
${activePreset.commEn.summary}

About the Company:
• Headcount: ${activePreset.companySize} employees
• Presence: ${activePreset.locations}

How to Apply:
Send your CV directly to \`${activePreset.email}\``}
              </pre>
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCopyCuratorMarkdown}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg surface-raised text-xs font-mono text-emerald-400 hover:text-white"
                >
                  {t("modalCopyMarkdown")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCloseCuratorModal();
                    onSelectPaidPlan(t("plan3Name"));
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium flex items-center justify-center gap-2"
                >
                  <span>{t("modalGetCurator")}</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[9px] uppercase font-semibold">
                    {t("comingSoonBadge")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
