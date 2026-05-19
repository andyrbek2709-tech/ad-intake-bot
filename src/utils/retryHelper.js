import { logger } from "./logger.js";

/**
 * Retry helper with exponential backoff
 * Handles rate limits and transient failures
 */
export async function retryWithBackoff(
  fn,
  maxRetries = 3,
  initialDelayMs = 1000
) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if this is a retryable error
      const isRateLimited = error.status === 429 || error.code === 'rate_limit_exceeded';
      const isTransient = error.status >= 500 || error.code === 'timeout';
      
      if (!isRateLimited && !isTransient && attempt < maxRetries - 1) {
        // Not retryable - throw immediately on last attempt
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
        logger.warn('Retrying after error', {
          attempt: attempt + 1,
          maxRetries,
          delayMs: Math.round(delayMs),
          error: error.message,
          status: error.status
        });
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  
  throw lastError;
}
