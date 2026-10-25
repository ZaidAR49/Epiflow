"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, variant = "info", duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, title, description, variant, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 visible

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (title: string, description?: string) => showToast({ title, description, variant: "success" }),
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string) => showToast({ title, description, variant: "error" }),
    [showToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => showToast({ title, description, variant: "warning" }),
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string) => showToast({ title, description, variant: "info" }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ showToast, dismissToast, success, error, warning, info }}
    >
      {children}
      {/* Toast Shelf Live Region */}
      <div
        aria-live="polite"
        role="region"
        aria-label="Notifications"
        className="fixed bottom-4 end-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const variantIcons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-[var(--accent)] shrink-0" />,
  };

  const variantBorders = {
    success: "border-emerald-500/30 bg-[var(--surface)] shadow-emerald-500/10",
    error: "border-rose-500/30 bg-[var(--surface)] shadow-rose-500/10",
    warning: "border-amber-500/30 bg-[var(--surface)] shadow-amber-500/10",
    info: "border-[var(--accent)]/30 bg-[var(--surface)] shadow-[var(--accent)]/10",
  };

  const variant = toast.variant || "info";

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${variantBorders[variant]}`}
    >
      <div className="mt-0.5">{variantIcons[variant]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-[var(--text)] leading-snug">{toast.title}</h4>
        {toast.description && (
          <p className="mt-1 text-[11px] text-[var(--text-muted)] leading-relaxed break-words">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
