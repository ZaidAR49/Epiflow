"use client";

import React from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface UserActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: "danger" | "warn" | "primary" | "success";
  isPending?: boolean;
}

export function UserActionDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "primary",
  isPending = false,
}: UserActionDialogProps) {
  const mappedVariant: "danger" | "warning" | "primary" =
    variant === "danger"
      ? "danger"
      : variant === "warn"
      ? "warning"
      : "primary";

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant={mappedVariant}
      isPending={isPending}
    />
  );
}
