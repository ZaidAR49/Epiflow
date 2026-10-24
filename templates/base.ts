import type {
  BaseEmailOptions,
  EmailBadgeVariant,
  EmailButton,
  EmailKeyValueItem,
  EmailLocale,
  RenderedEmail,
} from "./types";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getBadgeStyle(variant: EmailBadgeVariant = "default"): { bg: string; text: string; border: string } {
  switch (variant) {
    case "success":
      return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" };
    case "warning":
      return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" };
    case "danger":
      return { bg: "#FFF1F2", text: "#E11D48", border: "#FECDD3" };
    case "neutral":
      return { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" };
    case "default":
    default:
      return { bg: "#EEF2FF", text: "#4F46E5", border: "#C7D2FE" };
  }
}

function getButtonStyle(variant: EmailButton["variant"] = "primary"): { bg: string; text: string; border: string; shadow: string } {
  switch (variant) {
    case "success":
      return { bg: "#10B981", text: "#FFFFFF", border: "#10B981", shadow: "0 2px 6px rgba(16,185,129,0.3)" };
    case "secondary":
      return { bg: "#F8FAFC", text: "#0F172A", border: "#CBD5E1", shadow: "0 1px 2px rgba(0,0,0,0.05)" };
    case "danger":
      return { bg: "#F43F5E", text: "#FFFFFF", border: "#F43F5E", shadow: "0 2px 6px rgba(244,63,94,0.3)" };
    case "primary":
    default:
      return { bg: "#6366F1", text: "#FFFFFF", border: "#6366F1", shadow: "0 2px 6px rgba(99,102,241,0.3)" };
  }
}

function renderButtonHtml(btn: EmailButton): string {
  const s = getButtonStyle(btn.variant);
  return `
    <a href="${escapeHtml(btn.url)}" target="_blank" style="display: inline-block; background-color: ${s.bg}; color: ${s.text} !important; border: 1px solid ${s.border}; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center; margin: 4px; box-shadow: ${s.shadow};">
      ${escapeHtml(btn.label)}
    </a>
  `.trim();
}

function renderItemsHtml(items: EmailKeyValueItem[], isRtl: boolean): string {
  if (items.length === 0) return "";
  const align = isRtl ? "right" : "left";
  const rows = items
    .map(
      (it) => `
      <tr class="email-table-row" style="border-bottom: 1px solid #F1F5F9;">
        <td class="email-table-label" style="padding: 10px 14px; font-size: 13px; color: #64748B; font-weight: 500; text-align: ${align}; width: 36%;" valign="top">
          ${escapeHtml(it.label)}
        </td>
        <td class="email-table-val" style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0F172A; text-align: ${align};" valign="top">
          ${it.isMono ? `<span class="email-mono" style="background-color: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 6px; padding: 3px 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #0F172A; display: inline-block; direction: ltr;">${escapeHtml(it.value)}</span>` : escapeHtml(it.value)}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-table" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; margin: 18px 0; overflow: hidden;">
      ${rows}
    </table>
  `.trim();
}

export function renderBaseEmail(
  options: BaseEmailOptions,
  customBodyHtml: string,
  customBodyText: string
): RenderedEmail {
  const locale: EmailLocale = options.locale ?? "en";
  const isRtl = locale === "ar";
  const dir = isRtl ? "rtl" : "ltr";
  const align = isRtl ? "right" : "left";
  const fontFamily = isRtl
    ? "'Cairo', -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const badgeHtml = options.badge
    ? (() => {
        const bs = getBadgeStyle(options.badge.variant);
        return `<span style="display: inline-block; padding: 4px 10px; background-color: ${bs.bg}; border: 1px solid ${bs.border}; border-radius: 9999px; font-size: 11px; font-weight: 700; color: ${bs.text}; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(options.badge.text)}</span>`;
      })()
    : "";

  const highlightHtml = options.highlightBox
    ? (() => {
        const bs = getBadgeStyle(options.highlightBox.variant);
        return `
          <div class="email-box" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-inline-start: 3px solid ${bs.text}; border-radius: 8px; padding: 14px 18px; margin: 18px 0; font-size: 13px; line-height: 1.6; color: #1E293B; text-align: ${align};">
            ${options.highlightBox.title ? `<div style="font-weight: 700; margin-bottom: 4px; color: ${bs.text};">${escapeHtml(options.highlightBox.title)}</div>` : ""}
            <div>${options.highlightBox.content}</div>
          </div>
        `.trim();
      })()
    : "";

  const itemsHtml = options.items ? renderItemsHtml(options.items, isRtl) : "";

  const buttonsHtml = options.button || options.secondaryButton
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
        <tr>
          <td align="${isRtl ? "right" : "left"}" style="padding-top: 8px;">
            ${options.button ? renderButtonHtml(options.button) : ""}
            ${options.secondaryButton ? renderButtonHtml(options.secondaryButton) : ""}
          </td>
        </tr>
      </table>
    `
    : "";

  const previewTag = options.previewText
    ? `<div style="display:none;font-size:1px;color:#F8FAFC;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(options.previewText)}</div>`
    : "";

  const footerLinks = isRtl
    ? `
      <a href="https://epiflow.io" style="color: #64748B; text-decoration: underline; margin: 0 8px;">الموقع الرسمي</a>
      <a href="https://epiflow.io/ar/terms" style="color: #64748B; text-decoration: underline; margin: 0 8px;">الشروط</a>
      <a href="https://epiflow.io/ar/privacy" style="color: #64748B; text-decoration: underline; margin: 0 8px;">الخصوصية</a>
      <a href="https://epiflow.io/ar/contact" style="color: #64748B; text-decoration: underline; margin: 0 8px;">الدعم الفني</a>
    `
    : `
      <a href="https://epiflow.io" style="color: #64748B; text-decoration: underline; margin: 0 8px;">Website</a>
      <a href="https://epiflow.io/en/terms" style="color: #64748B; text-decoration: underline; margin: 0 8px;">Terms</a>
      <a href="https://epiflow.io/en/privacy" style="color: #64748B; text-decoration: underline; margin: 0 8px;">Privacy</a>
      <a href="https://epiflow.io/en/contact" style="color: #64748B; text-decoration: underline; margin: 0 8px;">Support</a>
    `;

  const footerNote = options.footerNote
    ? `<p style="margin: 0 0 10px 0; color: #64748B;">${escapeHtml(options.footerNote)}</p>`
    : isRtl
      ? `<p style="margin: 0 0 10px 0; color: #64748B;">هذا إشعار تشغيلي صادر عن منصة EpiFlow.</p>`
      : `<p style="margin: 0 0 10px 0; color: #64748B;">This is an automated operational notification from EpiFlow.</p>`;

  const html = `
<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(options.title)}</title>
  <style>
    @media (prefers-color-scheme: dark) {
      body, .email-bg { background-color: #090D16 !important; }
      .email-card { background-color: #0F172A !important; border-color: rgba(148, 163, 184, 0.16) !important; box-shadow: 0 12px 32px rgba(0,0,0,0.45) !important; }
      .email-header { border-bottom-color: rgba(148, 163, 184, 0.14) !important; }
      .email-brand { color: #FFFFFF !important; }
      .email-title { color: #FFFFFF !important; }
      .email-content { color: #E6EAF2 !important; }
      .email-muted { color: #8B97AD !important; }
      .email-box { background-color: #162036 !important; border-color: rgba(148, 163, 184, 0.16) !important; color: #F1F5F9 !important; }
      .email-table { background-color: #162036 !important; border-color: rgba(148, 163, 184, 0.14) !important; }
      .email-table-row { border-bottom-color: rgba(148, 163, 184, 0.08) !important; }
      .email-table-label { color: #8B97AD !important; }
      .email-table-val { color: #E6EAF2 !important; }
      .email-mono { background-color: #1E293B !important; border-color: rgba(148, 163, 184, 0.25) !important; color: #818CF8 !important; }
      .email-footer { background-color: #090D16 !important; border-top-color: rgba(148, 163, 184, 0.1) !important; color: #8B97AD !important; }
      .email-copyright { color: #475569 !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: ${fontFamily}; color: #0F172A; direction: ${dir}; -webkit-font-smoothing: antialiased;">
  ${previewTag}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-bg" style="background-color: #F8FAFC; padding: 36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" class="email-card" style="max-width: 580px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <!-- Linear-style Gradient Accent Bar -->
          <tr>
            <td style="height: 3px; background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%); line-height: 3px; font-size: 1px;">&nbsp;</td>
          </tr>

          <!-- Top Brand Header -->
          <tr>
            <td class="email-header" style="padding: 22px 28px 18px 28px; border-bottom: 1px solid #F1F5F9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="${align}" style="vertical-align: middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle; padding-inline-end: 9px;">
                          <div style="width: 26px; height: 26px; background: linear-gradient(135deg, #6366F1 0%, #4338CA 100%); border-radius: 7px; display: inline-block; text-align: center; line-height: 26px; font-size: 14px; color: #FFFFFF; font-weight: 800;">⚡</div>
                        </td>
                        <td style="vertical-align: middle;">
                          <span class="email-brand" style="font-size: 18px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px;">EpiFlow</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="${isRtl ? "left" : "right"}" style="vertical-align: middle;">
                    ${badgeHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 28px 28px 22px 28px; text-align: ${align};">
              <h1 class="email-title" style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0F172A; line-height: 1.35;">
                ${escapeHtml(options.title)}
              </h1>
              ${options.subtitle ? `<p class="email-muted" style="margin: 0 0 20px 0; font-size: 14px; color: #64748B; line-height: 1.5;">${escapeHtml(options.subtitle)}</p>` : ""}
              
              <!-- Content -->
              <div class="email-content" style="font-size: 14px; line-height: 1.65; color: #334155;">
                ${customBodyHtml}
              </div>

              ${itemsHtml}
              ${highlightHtml}
              ${buttonsHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding: 22px 28px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #64748B; line-height: 1.6;">
              ${footerNote}
              <div style="margin-top: 10px;">${footerLinks}</div>
              <div class="email-copyright" style="margin-top: 12px; font-size: 11px; color: #94A3B8;">
                &copy; ${new Date().getFullYear()} EpiFlow. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Plain Text Builder
  const textLines: string[] = [
    `=== EpiFlow // ${options.badge ? options.badge.text.toUpperCase() : "NOTIFICATION"} ===`,
    options.title,
    options.subtitle ?? "",
    "",
    customBodyText,
  ];

  if (options.items && options.items.length > 0) {
    textLines.push("", "--- Details ---");
    for (const item of options.items) {
      textLines.push(`${item.label}: ${item.value}`);
    }
  }

  if (options.button) {
    textLines.push("", `${options.button.label}: ${options.button.url}`);
  }
  if (options.secondaryButton) {
    textLines.push(`${options.secondaryButton.label}: ${options.secondaryButton.url}`);
  }

  textLines.push(
    "",
    "----------------------------------------",
    options.footerNote ?? "Automated notification from EpiFlow.",
    "https://epiflow.io"
  );

  return {
    subject: options.subject || options.title,
    html,
    text: textLines.filter((l) => l !== "").join("\n"),
  };
}
