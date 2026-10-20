"use client";

import { useState, useRef, useTransition, type DragEvent, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { UploadCloud, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { uploadWorkflowImageAction } from "@/lib/actions/admin";

interface WorkflowImageUploaderProps {
  workflowId: string;
  currentImageUrl?: string | null;
  onUploaded: (publicUrl: string) => void;
}

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export function WorkflowImageUploader({
  workflowId,
  currentImageUrl,
  onUploaded,
}: WorkflowImageUploaderProps) {
  const t = useTranslations("admin.workflows");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const processFile = (file: File) => {
    setStatusMessage(null);

    // Client-side validation: File size limit (10MB)
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      setStatusMessage({
        text: `File exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
        isError: true,
      });
      return;
    }

    // Client-side validation: MIME format check
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setStatusMessage({
        text: "Only popular image formats are supported (PNG, JPG, WebP, GIF, SVG)",
        isError: true,
      });
      return;
    }

    // Local instant preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Prepare FormData and trigger server action
    const formData = new FormData();
    formData.append("workflowId", workflowId);
    formData.append("file", file);

    startTransition(async () => {
      const res = await uploadWorkflowImageAction(formData);
      if (res.success && res.imageUrl) {
        setPreviewUrl(res.imageUrl);
        onUploaded(res.imageUrl);
        setStatusMessage({ text: t("uploadSuccess"), isError: false });
      } else {
        setStatusMessage({
          text: res.error || "Failed to upload image to Supabase",
          isError: true,
        });
      }
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[var(--text-muted)]">
        {t("uploadPicture")}
      </label>

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isPending && fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all ${
          isDragging
            ? "border-[var(--accent)] bg-[var(--accent)]/10"
            : "border-[var(--border)] bg-[var(--surface-2)]/40 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]"
        } ${isPending ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          {isPending ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : previewUrl ? (
            <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-inner">
              <Image
                src={previewUrl}
                alt="Workflow preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:scale-105 transition-transform border border-[var(--border)]">
              <UploadCloud className="h-5 w-5" />
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-[var(--text)]">
              {isPending ? t("uploading") : t("dragOrClick")}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {t("uploadHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Status Feedback Message */}
      {statusMessage && (
        <div
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
            statusMessage.isError
              ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
          }`}
        >
          {statusMessage.isError ? (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
}
