"use client";

import React from "react";

interface ChatMarkdownProps {
  content: string;
}

/**
 * Detects whether the text contains Arabic characters.
 */
function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

/**
 * Renders inline Markdown tokens safely:
 * - Backtick code blocks / emails: dir="ltr" inline-block with monospace styling
 * - Bold: **text** or __text__ or *text*
 * - Italic: _text_
 * - Links: [label](url)
 * - Flag callouts: ⚠️ and ℹ️
 */
function renderInline(text: string, isArabic: boolean): React.ReactNode[] {
  // Regex splitting by code tokens, links, bold, and italic
  const tokenRegex =
    /(`[^`\n]+`)|(\[[^\]]+\]\(https?:\/\/[^\s)]+\))|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|((?<![*\w])\*[^*\n]+\*(?![*\w]))|((?<![_\w])_[^_\n]+_(?![_\w]))/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`txt_${lastIndex}`} dir={isArabic ? "rtl" : "ltr"}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    const token = match[0];
    const key = `tok_${match.index}`;

    if (token.startsWith("`") && token.endsWith("`")) {
      const code = token.slice(1, -1);
      parts.push(
        <span
          key={key}
          dir="ltr"
          className="inline-block font-mono text-[10.5px] bg-[var(--surface)] text-emerald-400 px-1.5 py-0.5 rounded border border-[var(--border)] select-all mx-0.5"
        >
          {code}
        </span>
      );
    } else if (token.startsWith("[") && token.includes("](")) {
      const linkMatch = token.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
      if (linkMatch && linkMatch[1] && linkMatch[2]) {
        parts.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            dir="auto"
            className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5 font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(<span key={key}>{token}</span>);
      }
    } else if (
      (token.startsWith("**") && token.endsWith("**")) ||
      (token.startsWith("__") && token.endsWith("__"))
    ) {
      const boldText = token.slice(2, -2);
      parts.push(
        <strong key={key} className="font-bold text-[var(--text)]">
          {boldText}
        </strong>
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      const emText = token.slice(1, -1);
      parts.push(
        <strong key={key} className="font-semibold text-[var(--text)]">
          {emText}
        </strong>
      );
    } else {
      parts.push(<span key={key}>{token}</span>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`txt_${lastIndex}`} dir={isArabic ? "rtl" : "ltr"}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return parts;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  if (!content) return null;

  // Clean hidden metadata tags and normalize breaks
  const cleaned = content
    .replace(/<a\s+href="https:\/\/hidden\.data\/?.*?".*?<\/a>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/\r\n/g, "\n");

  const isArabic = isArabicText(cleaned);
  const lines = cleaned.split("\n");

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`text-start space-y-1.5 leading-relaxed ${
        isArabic ? "font-cairo" : ""
      }`}
    >
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // 1. Empty lines -> spacing
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // 2. Horizontal divider
        if (/^(?:-{3,}|\*{3,}|_{3,}|─{3,})$/.test(trimmed)) {
          return (
            <hr
              key={idx}
              className="border-t border-[var(--border)] my-2 opacity-60"
            />
          );
        }

        // 3. Level 2 Heading (## Title)
        if (trimmed.startsWith("## ")) {
          const title = trimmed.replace(/^##\s+/, "");
          return (
            <h3
              key={idx}
              className="text-xs font-bold text-[var(--text)] border-b border-[var(--border)] pb-1 mt-2 mb-1"
            >
              {renderInline(title, isArabic)}
            </h3>
          );
        }

        // 4. Level 3 Heading (### Title)
        if (trimmed.startsWith("### ")) {
          const title = trimmed.replace(/^###\s+/, "");
          return (
            <h4
              key={idx}
              className="text-xs font-bold text-[var(--accent)] mt-2 mb-0.5 flex items-center gap-1.5"
            >
              {renderInline(title, isArabic)}
            </h4>
          );
        }

        // 5. Level 4 Heading (#### Title)
        if (trimmed.startsWith("####")) {
          const title = trimmed.replace(/^####\s*/, "");
          return (
            <h5
              key={idx}
              className="text-[11px] font-semibold text-[var(--text)] opacity-90 mt-1 mb-0.5"
            >
              {renderInline(title, isArabic)}
            </h5>
          );
        }

        // 6. Bullet points (* bullet, - bullet, • bullet)
        if (/^[\*\-•]\s+/.test(trimmed)) {
          const itemText = trimmed.replace(/^[\*\-•]\s+/, "");
          return (
            <div
              key={idx}
              className="flex items-start gap-1.5 ps-1 py-0.5 text-[11px]"
            >
              <span className="text-[var(--accent)] shrink-0 select-none">•</span>
              <div className="flex-1 min-w-0">
                {renderInline(itemText, isArabic)}
              </div>
            </div>
          );
        }

        // 7. Standard paragraph line
        return (
          <p key={idx} className="text-[11px] leading-relaxed break-words">
            {renderInline(trimmed, isArabic)}
          </p>
        );
      })}
    </div>
  );
}
