import { AppError, ErrorCodes } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import { logger } from "@/lib/logger";

export interface DownloadedFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

/**
 * Extracts Google Drive file ID from varied share URL formats.
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;

  // Patterns:
  // https://drive.google.com/file/d/{id}/view...
  // https://drive.google.com/open?id={id}
  // https://drive.google.com/uc?id={id}
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  const idQueryMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch && idQueryMatch[1]) {
    return idQueryMatch[1];
  }

  return null;
}

/**
 * Downloads public / shared Google Drive file without requiring drive.readonly scope.
 */
export async function downloadCvFromGoogleDrive(
  driveUrl: string,
  accessToken?: string
): Promise<Result<DownloadedFile, AppError>> {
  const fileId = extractGoogleDriveFileId(driveUrl);
  if (!fileId) {
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        400,
        "Invalid Google Drive URL in user profile"
      )
    );
  }

  logger.info({ fileId, hasToken: !!accessToken }, "Downloading CV from Google Drive");

  // 1. If accessToken provided, download via official Google Drive v3 API
  if (accessToken) {
    try {
      const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get("content-type") || "application/pdf";
        return ok({
          buffer,
          filename: "Resume.pdf",
          mimeType,
        });
      }
      logger.warn(
        { status: response.status, fileId },
        "Google Drive API download returned non-200, attempting public export"
      );
    } catch (apiErr) {
      logger.warn({ apiErr, fileId }, "Google Drive API download error, attempting public export");
    }
  }

  // 2. Fallback to public export URL
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  try {
    const response = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!response.ok) {
      return err(
        new AppError(
          ErrorCodes.INTERNAL_ERROR,
          502,
          `Failed to download CV from Google Drive: HTTP ${response.status}`
        )
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine filename & MIME
    const contentDisposition = response.headers.get("content-disposition");
    let filename = "Resume.pdf";
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const mimeType = response.headers.get("content-type") || "application/pdf";

    return ok({
      buffer,
      filename,
      mimeType,
    });
  } catch (error) {
    logger.error({ error, fileId }, "Error downloading CV file from Google Drive");
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        502,
        "Failed to fetch CV file from Google Drive",
        { cause: error }
      )
    );
  }
}
