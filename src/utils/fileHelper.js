import { logger } from "./logger.js";

// Configuration
export const FILE_LIMITS = {
  MAX_SIZE_MB: process.env.MAX_FILE_SIZE_MB || 50,  // 50 MB default
  MAX_PDF_SIZE_MB: process.env.MAX_PDF_SIZE_MB || 100,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain']
};

/**
 * Validate file size and type
 */
export function validateFileSize(fileSize, fileType = null) {
  const maxMb = fileType === 'application/pdf' 
    ? FILE_LIMITS.MAX_PDF_SIZE_MB 
    : FILE_LIMITS.MAX_SIZE_MB;
  
  const maxBytes = maxMb * 1024 * 1024;
  
  if (fileSize > maxBytes) {
    const error = new Error(
      `File too large: ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds ${maxMb}MB limit`
    );
    error.code = 'FILE_TOO_LARGE';
    throw error;
  }
  
  return true;
}

/**
 * Build user-friendly file error message
 */
export function getFileLimitMessage() {
  return `📁 Максимальный размер файла: ${FILE_LIMITS.MAX_SIZE_MB}MB`;
}
