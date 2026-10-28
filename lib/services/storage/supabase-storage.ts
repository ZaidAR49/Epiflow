import "server-only";
import { AppError, ErrorCodes } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export interface UploadImageOptions {
  bucket: string;
  path: string;
  buffer: Buffer;
  contentType: string;
}

export interface UploadImageResult {
  publicUrl: string;
  path: string;
}

/**
 * Validates buffer magic bytes against declared MIME type to prevent spoofed uploads.
 */
export function verifyImageMagicBytes(
  buffer: Buffer,
  contentType: string
): boolean {
  if (!buffer || buffer.length < 12) return false;

  // PNG: 89 50 4E 47
  if (
    contentType === "image/png" &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // JPEG: FF D8 FF
  if (
    contentType === "image/jpeg" &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return true;
  }

  // GIF: 47 49 46
  if (
    contentType === "image/gif" &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46
  ) {
    return true;
  }

  // WebP: RIFF .... WEBP
  if (
    contentType === "image/webp" &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return true;
  }

  return false;
}

/**
 * Validates file size (max 10MB) and MIME type for image uploads.
 */
export function validateImageFile(file: {
  size: number;
  type: string;
  buffer?: Buffer;
}): Result<true, AppError> {
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        400,
        `Image size exceeds maximum limit of 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB provided)`
      )
    );
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as AllowedImageMimeType)) {
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        400,
        `Unsupported image format (${file.type}). Allowed formats: PNG, JPG, WebP, GIF`
      )
    );
  }

  if (file.buffer && !verifyImageMagicBytes(file.buffer, file.type)) {
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        400,
        "File signature does not match declared image type (corrupt or spoofed file)"
      )
    );
  }

  return ok(true);
}

/**
 * Uploads a file to a Supabase Storage bucket and returns its public URL.
 * Automatically enables x-upsert to overwrite previous revisions.
 */
export async function uploadPublicImage(
  options: UploadImageOptions
): Promise<Result<UploadImageResult, AppError>> {
  const validation = validateImageFile({
    size: options.buffer.length,
    type: options.contentType,
    buffer: options.buffer,
  });
  if (!validation.success) {
    return validation;
  }

  const env = getServerEnv();

  // Resolve Supabase URL from env or fallback to project ref in DATABASE_URL
  let supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl && env.DATABASE_URL) {
    const projectRefMatch = env.DATABASE_URL.match(/postgres\.([a-zA-Z0-9_-]+):/);
    if (projectRefMatch && projectRefMatch[1]) {
      supabaseUrl = `https://${projectRefMatch[1]}.supabase.co`;
    }
  }

  if (!supabaseUrl) {
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        "SUPABASE_URL is not configured and could not be inferred from DATABASE_URL"
      )
    );
  }

  const serviceKey =
    env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        "SUPABASE_SERVICE_ROLE_KEY is required in .env.local to upload images to Supabase Storage"
      )
    );
  }

  const uploadEndpoint = `${supabaseUrl}/storage/v1/object/${options.bucket}/${options.path}`;

  try {
    const res = await fetch(uploadEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": options.contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(options.buffer),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error({ status: res.status, errText, path: options.path }, "Supabase storage upload failed");
      return err(
        new AppError(
          ErrorCodes.INTERNAL_ERROR,
          res.status,
          `Failed to upload image to Supabase Storage: ${errText || res.statusText}`
        )
      );
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${options.bucket}/${options.path}`;
    logger.info({ publicUrl, path: options.path }, "Uploaded image to Supabase Storage successfully");

    return ok({ publicUrl, path: options.path });
  } catch (error) {
    logger.error({ error, path: options.path }, "Network error during Supabase storage upload");
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        502,
        "Network error communicating with Supabase Storage",
        { cause: error }
      )
    );
  }
}

/**
 * Deletes objects from a Supabase Storage bucket.
 */
export async function deletePublicImages(
  bucket: string,
  paths: string[]
): Promise<Result<boolean, AppError>> {
  const env = getServerEnv();
  const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey =
    env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        "Supabase credentials not configured"
      )
    );
  }

  try {
    const deleteEndpoint = `${supabaseUrl}/storage/v1/object/${bucket}`;
    const res = await fetch(deleteEndpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: paths }),
    });

    return ok(res.ok);
  } catch (error) {
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        502,
        "Failed to delete files from Supabase Storage",
        { cause: error }
      )
    );
  }
}
