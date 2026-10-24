import React from "react";
import { useTranslations } from "next-intl";
import { ContactForm } from "./contact-form";
import { MessageSquareText } from "lucide-react";

export function ContactView() {
  const t = useTranslations("contact");

  return (
    <section className="relative overflow-hidden py-12 sm:py-16">
      {/* Background Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative start-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#6366F1] to-[#10B981] opacity-15 sm:start-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header Eyebrow & Title */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3.5 py-1 text-xs font-semibold text-[var(--accent)] mb-4">
            <MessageSquareText className="h-3.5 w-3.5" />
            <span>{t("badge")}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)] sm:text-base max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Centered Main Contact Form */}
        <ContactForm />
      </div>
    </section>
  );
}
