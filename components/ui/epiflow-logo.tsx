import React from "react";
import Image from "next/image";

interface EpiFlowLogoProps {
  /**
   * "full" displays the horizontal brand wordmark + node flow.
   * "icon" displays the square brand icon mark.
   * @default "full"
   */
  variant?: "full" | "icon";
  /** Height in pixels. Width will automatically scale based on aspect ratio. */
  height?: number;
  /** Width in pixels for "icon" variant or explicit override. */
  width?: number;
  className?: string;
  glow?: boolean;
  priority?: boolean;
}

export function EpiFlowLogo({
  variant = "full",
  height = 32,
  width,
  className = "",
  glow = false,
  priority = true,
}: EpiFlowLogoProps) {
  // epiflow-logo.svg viewBox is 1200 x 500 (aspect ratio 2.4)
  const fullWidth = width ?? Math.round(height * 2.4);
  const iconDim = height;

  if (variant === "icon") {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-xl bg-[#0F172A] border border-[var(--border)] transition-transform duration-200 ${
          glow ? "hover:scale-105 shadow-md shadow-indigo-500/20" : ""
        } ${className}`}
        style={{ width: iconDim, height: iconDim }}
      >
        <Image
          src="/epiflow-favicon.svg"
          alt="EpiFlow Icon"
          width={iconDim}
          height={iconDim}
          priority={priority}
          unoptimized
          className="object-contain h-full w-full select-none p-1"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center shrink-0 select-none transition-transform duration-200 ${
        glow ? "hover:scale-[1.02]" : ""
      } ${className}`}
      style={{ height }}
    >
      {glow && (
        <div
          className="absolute -inset-1 rounded-lg bg-gradient-to-r from-teal-500/15 via-blue-500/15 to-purple-600/15 blur-md pointer-events-none"
          aria-hidden="true"
        />
      )}
      <Image
        src="/epiflow-logo.svg"
        alt="EpiFlow Logo"
        width={fullWidth}
        height={height}
        priority={priority}
        unoptimized
        className="relative z-10 object-contain h-full w-auto select-none"
      />
    </div>
  );
}
