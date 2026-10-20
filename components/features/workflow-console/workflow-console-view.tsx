"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Sliders, Sparkles } from "lucide-react";
import { BrowserChat } from "@/components/features/test-bench/browser-chat";
import { EmailPromptModal } from "@/components/features/test-bench/email-prompt-modal";
import { WorkflowQuotaCard } from "@/components/features/profile/workflow-quota-card";
import { WorkflowSettingsForm } from "@/components/features/settings/workflow-settings-form";
import { WorkflowCredentialsCard } from "@/components/features/settings/workflow-credentials-card";
import { useWorkflowStream } from "@/hooks/use-workflow-stream";
import type { UserWorkflowProfile } from "@/lib/db/queries/access";
import type { WorkflowCredentialStatus } from "@/lib/db/queries/credentials";

interface WorkflowConsoleViewProps {
  workflow: UserWorkflowProfile;
  slug: string;
  initialCredential: WorkflowCredentialStatus | null;
}

export function WorkflowConsoleView({
  workflow,
  slug,
  initialCredential,
}: WorkflowConsoleViewProps) {
  const t = useTranslations("workflowConsole");
  const locale = useLocale();

  const [inputUrl, setInputUrl] = useState("");

  const {
    messages,
    isRunning,
    syncToTelegram,
    setSyncToTelegram,
    promptMetadata,
    setPromptMetadata,
    isDrafting,
    draftUrl,
    runStream,
    executeDraft,
    clearMessages,
  } = useWorkflowStream();

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div className="space-y-1">
          <Link
            href={`/${locale}/profile`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
            <span>{t("backToProfile")}</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)]">
              {workflow.workflowName}
            </h1>
            <span className="rounded-md bg-[var(--accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)] border border-[var(--accent)]/20">
              Console
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/test-workflow`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3.5 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{t("testWorkflowShortcut")}</span>
          </Link>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Browser Chat (Spacious & Zoomable) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>In-Browser Runner</span>
            </span>
          </div>

          <BrowserChat
            messages={messages}
            inputUrl={inputUrl}
            onInputChange={setInputUrl}
            onSendMessage={(customUrl) => runStream(customUrl || inputUrl)}
            onButtonClick={(action, meta) => {
              if (action === "yes") {
                executeDraft(meta);
              }
            }}
            onClear={clearMessages}
            isRunning={isRunning}
            syncToTelegram={syncToTelegram}
            onToggleSyncToTelegram={setSyncToTelegram}
            heightClass="h-[620px]"
            allowZoom={true}
          />
        </div>

        {/* Right Column: Workflow-specific Usage Meter & Metadata Preferences */}
        <div className="lg:col-span-5 space-y-6">
          <WorkflowQuotaCard
            usageCount={workflow.usageCount}
            usageLimit={workflow.usageLimit}
            expiresAt={workflow.expiresAt}
          />

          <WorkflowSettingsForm
            initialMetadata={workflow.metadata}
          />

          <WorkflowCredentialsCard
            slug={slug}
            initialCredential={initialCredential}
          />
        </div>
      </div>

      {/* Interactive Gmail Draft Prompt Modal */}
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
