import { useTranslations } from "next-intl";
import { Check, X, Sparkles } from "lucide-react";

export function WorkflowComparison() {
  const t = useTranslations("workflowLanding");

  const rows = [
    {
      metric: t("compRow1Metric"),
      premium: t("compRow1Premium"),
      xray: t("compRow1Xray"),
      xrayHighlight: true,
    },
    {
      metric: t("compRow2Metric"),
      premium: t("compRow2Premium"),
      xray: t("compRow2Xray"),
      premiumNegative: true,
      xrayPositive: true,
    },
    {
      metric: t("compRow3Metric"),
      premium: t("compRow3Premium"),
      xray: t("compRow3Xray"),
      premiumNegative: true,
      xrayPositive: true,
    },
    {
      metric: t("compRow4Metric"),
      premium: t("compRow4Premium"),
      xray: t("compRow4Xray"),
      xrayPositive: true,
    },
    {
      metric: t("compRow5Metric"),
      premium: t("compRow5Premium"),
      xray: t("compRow5Xray"),
      xrayPositive: true,
    },
  ];

  return (
    <section id="comparison" className="py-20 border-b border-[var(--border)] bg-[var(--surface)]/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--accent)] mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Value Comparison</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
            {t("comparisonTitle")}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            {t("comparisonSubtitle")}
          </p>
        </div>

        <div className="mt-14 overflow-x-auto">
          <div className="min-w-[640px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/80 text-[var(--text-muted)]">
                  <th className="py-4 px-6 text-start font-semibold">
                    {t("compColMetric")}
                  </th>
                  <th className="py-4 px-6 text-start font-semibold w-2/5">
                    {t("compColPremium")}
                  </th>
                  <th className="py-4 px-6 text-start font-bold text-[var(--accent)] bg-[var(--accent)]/5 border-s border-[var(--accent)]/20 w-2/5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>{t("compColXray")}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[var(--surface-2)]/40 transition-colors"
                  >
                    <td className="py-4 px-6 font-bold text-[var(--text)]">
                      {row.metric}
                    </td>
                    <td className="py-4 px-6 text-[var(--text-muted)]">
                      <div className="flex items-center gap-2">
                        {row.premiumNegative && (
                          <X className="h-4 w-4 shrink-0 text-rose-400" />
                        )}
                        <span>{row.premium}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-[var(--text)] bg-[var(--accent)]/5 border-s border-[var(--accent)]/20">
                      <div className="flex items-center gap-2">
                        {row.xrayPositive && (
                          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                        )}
                        <span className={row.xrayHighlight ? "font-bold text-[var(--accent)]" : ""}>
                          {row.xray}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
