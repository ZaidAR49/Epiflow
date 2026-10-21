"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, HelpCircle } from "lucide-react";

export function WorkflowFaq() {
  const t = useTranslations("workflowLanding");

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: t("faqQ1"), a: t("faqA1") },
    { q: t("faqQ2"), a: t("faqA2") },
    { q: t("faqQ3"), a: t("faqA3") },
    { q: t("faqQ4"), a: t("faqA4") },
    { q: t("faqQ5"), a: t("faqA5") },
  ];

  return (
    <section id="faq" className="py-20 border-b border-[var(--border)] bg-[var(--surface)]/20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--accent)] mb-3">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{t("navFaq")}</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
            {t("faqTitle")}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            {t("faqSubtitle")}
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-start font-bold text-sm sm:text-base text-[var(--text)] transition-colors hover:text-[var(--accent)] focus:outline-none"
                >
                  <span className="pe-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[var(--accent)]" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--border)] bg-[var(--surface-2)]/40 p-5 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed text-start">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
