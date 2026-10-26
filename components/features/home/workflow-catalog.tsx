import React from "react";
import { useTranslations } from "next-intl";
import { WorkflowCard } from "./workflow-card";
import { LayoutGrid } from "lucide-react";
import type { WorkflowSummary } from "@/lib/db/queries/workflows";

interface WorkflowCatalogProps {
  workflows: WorkflowSummary[];
  subscribedSlugs?: string[];
}

export function WorkflowCatalog({
  workflows,
  subscribedSlugs = [],
}: WorkflowCatalogProps) {
  const t = useTranslations("landing");

  return (
    <section id="workflows" className="relative py-16 sm:py-24 border-t border-[var(--border)]/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-1 text-xs font-semibold text-teal-400 mb-3">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>{t("catalogBadge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
            {t("catalogTitle")}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            {t("catalogSubtitle")}
          </p>
        </div>

        {/* Dynamic Workflow Grid */}
        <div
          className={
            workflows.length === 1
              ? "max-w-2xl mx-auto"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          }
        >
          {/* Active Workflows from the Database */}
          {workflows.map((wf) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              isFlagship={wf.slug === "job-xray"}
              isSubscribed={subscribedSlugs.includes(wf.slug)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
