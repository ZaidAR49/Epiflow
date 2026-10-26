"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Tag,
  Layers,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { submitContactAction } from "@/lib/actions/contact";
import type { ContactCategory } from "@/lib/validation/contact";

export function ContactForm() {
  const t = useTranslations("contact");
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<ContactCategory>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    isSimulated?: boolean;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const result = await submitContactAction({
        name,
        email,
        category,
        subject,
        message,
        website: honeypot,
      });

      if (result.success) {
        setSuccessData({ isSimulated: result.isSimulated });
      } else {
        setErrorMessage(result.message || "Failed to deliver message");
      }
    });
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setCategory("general");
    setSubject("");
    setMessage("");
    setHoneypot("");
    setErrorMessage(null);
    setSuccessData(null);
  };

  if (successData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-[var(--surface)] p-8 text-center shadow-lg sm:p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-5">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-bold text-[var(--text)] sm:text-2xl">
          {t("successTitle")}
        </h3>

        <p className="mt-3 max-w-md text-sm text-[var(--text-muted)] leading-relaxed">
          {t("successDesc")}
        </p>

        {successData.isSimulated && (
          <div className="mt-5 max-w-lg rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 text-start flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <span>{t("simulatedNotice")}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-5 py-2.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
        >
          <span>{t("sendAnother")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8 shadow-xl min-w-0">
      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Invisible Honeypot Anti-Spam Field */}
        <div
          aria-hidden="true"
          style={{
            opacity: 0,
            position: "absolute",
            top: 0,
            insetInlineStart: 0,
            height: 0,
            width: 0,
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <label htmlFor="website">Website</label>
          <input
            id="website"
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Sender Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="contact-name"
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] mb-2"
            >
              <User className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span>{t("nameLabel")}</span>
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              disabled={isPending}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="contact-email"
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] mb-2"
            >
              <Mail className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span>{t("emailLabel")}</span>
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              dir="ltr"
              disabled={isPending}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Category & Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="contact-category"
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] mb-2"
            >
              <Layers className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span>{t("categoryLabel")}</span>
            </label>
            <select
              id="contact-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ContactCategory)}
              disabled={isPending}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors disabled:opacity-50 cursor-pointer"
            >
              <option value="general" className="bg-[#0F172A] text-white">{t("catGeneral")}</option>
              <option value="support" className="bg-[#0F172A] text-white">{t("catSupport")}</option>
              <option value="partnership" className="bg-[#0F172A] text-white">{t("catPartnership")}</option>
              <option value="feedback" className="bg-[#0F172A] text-white">{t("catFeedback")}</option>
              <option value="billing" className="bg-[#0F172A] text-white">{t("catBilling")}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="contact-subject"
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] mb-2"
            >
              <Tag className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span>{t("subjectLabel")}</span>
            </label>
            <input
              id="contact-subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("subjectPlaceholder")}
              disabled={isPending}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="contact-message"
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] mb-2"
          >
            <MessageSquare className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span>{t("messageLabel")}</span>
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("messagePlaceholder")}
            disabled={isPending}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors disabled:opacity-50 resize-y"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[var(--accent)]/90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-all duration-200 disabled:opacity-50 cursor-pointer hover:shadow-indigo-500/20"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("sendingButton")}</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4 rtl:-scale-x-100" />
              <span>{t("sendButton")}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
