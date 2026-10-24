"use client";

import React from "react";
import { User, Sparkles } from "lucide-react";

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  isSubscribed?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    container: "h-8 w-8",
    avatar: "h-7 w-7",
    icon: "h-3.5 w-3.5",
    badge: "h-3 w-3 -bottom-0.5 -end-0.5",
    badgeIcon: "h-2 w-2",
    ringPadding: "p-[2px]",
  },
  md: {
    container: "h-11 w-11",
    avatar: "h-9 w-9",
    icon: "h-4.5 w-4.5",
    badge: "h-3.5 w-3.5 -bottom-0.5 -end-0.5",
    badgeIcon: "h-2.5 w-2.5",
    ringPadding: "p-[2.5px]",
  },
  lg: {
    container: "h-16 w-16",
    avatar: "h-14 w-14",
    icon: "h-7 w-7",
    badge: "h-5 w-5 bottom-0 end-0",
    badgeIcon: "h-3 w-3",
    ringPadding: "p-[3px]",
  },
  xl: {
    container: "h-22 w-22",
    avatar: "h-18 w-18",
    icon: "h-9 w-9",
    badge: "h-6 w-6 bottom-0.5 end-0.5",
    badgeIcon: "h-3.5 w-3.5",
    ringPadding: "p-[3.5px]",
  },
};

export function UserAvatar({
  src,
  name,
  size = "sm",
  isSubscribed = false,
  className = "",
}: UserAvatarProps) {
  const cfg = sizeConfig[size];

  if (isSubscribed) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${cfg.container} ${className}`}
        title={name ? `${name} (Subscribed Member)` : "Subscribed Member"}
      >
        {/* Animated Google-Style Liquid Sky Blue Outer Ring */}
        <div
          className={`relative flex items-center justify-center rounded-full overflow-hidden ${cfg.container} ${cfg.ringPadding} shadow-[0_0_12px_rgba(56,189,248,0.45)]`}
        >
          {/* Swirling Conic Gradient mimicking Google One / AI Premium liquid halo */}
          <div
            className="absolute inset-[-60%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,#38bdf8_0%,#0ea5e9_25%,#06b6d4_50%,#67e8f9_75%,#38bdf8_100%)] opacity-95 blur-[0.5px]"
            aria-hidden="true"
          />

          {/* Inner dark spacer to let the liquid ring glow around the photo */}
          <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-[var(--surface)] p-[1.5px]">
            <div
              className={`relative flex ${cfg.avatar} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-2)]`}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={name || "User Avatar"}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className={`${cfg.icon} text-sky-400`} />
              )}
            </div>
          </div>
        </div>

        {/* Liquid Member Badge */}
        <div
          className={`absolute z-20 flex items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 via-sky-400 to-cyan-300 text-slate-950 shadow-md ring-1 ring-[var(--surface)] ${cfg.badge}`}
          aria-hidden="true"
        >
          <Sparkles className={cfg.badgeIcon} />
        </div>
      </div>
    );
  }

  // Standard non-subscribed avatar
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      title={name || "User Avatar"}
    >
      <div
        className={`relative flex ${cfg.avatar} shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-[var(--accent)]/30 bg-[var(--surface-2)] border border-[var(--border)]`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name || "User Avatar"}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <User className={`${cfg.icon} text-[var(--accent)]`} />
        )}
      </div>
    </div>
  );
}
