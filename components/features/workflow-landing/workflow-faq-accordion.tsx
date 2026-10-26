"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

export function WorkflowFaqAccordion() {
  const t = useTranslations("workflowLanding");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: t("faqQ1"),
      a: t("faqA1"),
    },
    {
      q: t("faqQ2"),
      a: t("faqA2"),
    },
    {
      q: t("faqQ3"),
      a: t("faqA3"),
    },
    {
      q: t("faqQ4"),
      a: t("faqA4"),
    },
  ];

  return (
    <section id="faq" className="py-12 sm:py-20 lg:py-28 border-b hairline-border min-w-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
            {t("faqEyebrow")}
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[var(--text)] mt-3 break-words">
            {t("faqTitle")}
          </h2>
        </div>

        <div className="space-y-3 sm:space-y-4 text-start">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="surface-card rounded-xl overflow-hidden min-w-0">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-6 lg:p-7 text-start flex items-center justify-between gap-3 sm:gap-4 focus:outline-none transition-colors hover:text-[var(--accent)]"
                >
                  <span className="font-heading font-semibold text-sm sm:text-lg text-[var(--text)] break-words">
                    {faq.q}
                  </span>
                  <span
                    className={`font-mono text-sm shrink-0 ${
                      isOpen ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {isOpen ? "[-]" : "[+]"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-6 lg:px-7 pb-5 sm:pb-7 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed border-t hairline-border pt-4">
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
