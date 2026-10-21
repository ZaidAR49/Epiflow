"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { WorkflowLandingProps } from "./types";
import { DEFAULT_PRESET, getLocalizedPreset } from "./presets-data";
import { WorkflowNavBar } from "./workflow-nav-bar";
import { WorkflowHeroHeader } from "./workflow-hero-header";
import { WorkflowExplorer } from "./workflow-explorer";
import { WorkflowTelemetryStrip } from "./workflow-telemetry-strip";
import { WorkflowAudiences } from "./workflow-audiences";
import { WorkflowCapabilities } from "./workflow-capabilities";
import { WorkflowPipelineSteps } from "./workflow-pipeline-steps";
import { WorkflowComparisonMatrix } from "./workflow-comparison-matrix";
import { WorkflowPricingEngine } from "./workflow-pricing-engine";
import { WorkflowFaqAccordion } from "./workflow-faq-accordion";
import { WorkflowCtaBanner } from "./workflow-cta-banner";
import { WorkflowFooter } from "./workflow-footer";
import { WorkflowModals } from "./workflow-modals";

export function WorkflowLandingView({
  slug,
  workflowName = "JobPost X-Ray",
  imageUrl,
  hasAccess = false,
  isAuthenticated = false,
}: WorkflowLandingProps) {
  const locale = useLocale();
  const t = useTranslations("workflowLanding");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isCuratorModalOpen, setIsCuratorModalOpen] = useState(false);

  // If user is authorized, navigate straight to workflow console; if unauthorized, redirect to sign-in
  const tryWorkflowUrl = isAuthenticated
    ? `/${locale}/workflows/${slug}/console`
    : `/${locale}/sign-in?callbackUrl=/${locale}/workflows/${slug}/console`;

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSelectPaidPlan = (planName: string) => {
    showToast(t("comingSoonNotice", { plan: planName }));
  };

  const handleCopyCuratorMarkdown = () => {
    const text = `## Sr. Backend Engineer — Acme Corp\n----------------------------------------\nLocation: Remote (EU/MENA) | Job Type: Full-Time | Exp: 5+ Years\n\nRole Summary:\nScaling Core Platform architecture using Go, distributed systems, and high-throughput event pipelines.\n\nAbout the Company:\n• Industry: Financial Infrastructure\n• Size: 201 - 500 employees\n• Presence: United Kingdom, Germany, UAE\n\nHow to Apply:\nSend your CV directly to \`careers@acme-corp.com\``;
    navigator.clipboard?.writeText(text);
    showToast(t("toastCopiedMarkdown"));
  };

  const activePreset = getLocalizedPreset(DEFAULT_PRESET, locale);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] overflow-x-hidden selection:bg-[var(--accent)] selection:text-white">
      {/* Sticky Top Navigation Bar */}
      <WorkflowNavBar
        slug={slug}
        workflowName={workflowName}
        imageUrl={imageUrl}
        hasAccess={hasAccess}
        isAuthenticated={isAuthenticated}
      />

      <main>
        {/* Spacious Hero Section & Interactive Centerpiece */}
        <section className="relative hero-ambient pt-20 pb-28 lg:pt-28 lg:pb-36 border-b hairline-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <WorkflowHeroHeader
              workflowName={workflowName}
              tryWorkflowUrl={tryWorkflowUrl}
            />
            <WorkflowExplorer
              onShowToast={showToast}
              onOpenGmailModal={() => setIsGmailModalOpen(true)}
              onOpenCuratorModal={() => setIsCuratorModalOpen(true)}
            />
            <WorkflowTelemetryStrip />
          </div>
        </section>

        {/* Dual Audience Section: Job Seekers & Community Curators */}
        <WorkflowAudiences
          onOpenCuratorModal={() => setIsCuratorModalOpen(true)}
        />

        {/* Deep Enrichment Capabilities Grid (6 Features) */}
        <WorkflowCapabilities />

        {/* How It Works (3-Step Pipeline) */}
        <WorkflowPipelineSteps />

        {/* Side-by-Side Comparison Matrix */}
        <WorkflowComparisonMatrix />

        {/* Simple, Honest Pricing Section ($0 / $5 / $15 + 3 Modes) */}
        <WorkflowPricingEngine
          tryWorkflowUrl={tryWorkflowUrl}
          onSelectPaidPlan={handleSelectPaidPlan}
        />

        {/* Interactive FAQ Accordion */}
        <WorkflowFaqAccordion />

        {/* Final High-Impact CTA Banner */}
        <WorkflowCtaBanner tryWorkflowUrl={tryWorkflowUrl} />
      </main>

      {/* Clean Footer */}
      <WorkflowFooter
        workflowName={workflowName}
        imageUrl={imageUrl}
      />

      {/* Interactive Modals & Toast */}
      <WorkflowModals
        isGmailModalOpen={isGmailModalOpen}
        isCuratorModalOpen={isCuratorModalOpen}
        onCloseGmailModal={() => setIsGmailModalOpen(false)}
        onCloseCuratorModal={() => setIsCuratorModalOpen(false)}
        onCopyCuratorMarkdown={handleCopyCuratorMarkdown}
        onSelectPaidPlan={handleSelectPaidPlan}
        activePreset={activePreset}
        toastMessage={toastMessage}
      />
    </div>
  );
}
