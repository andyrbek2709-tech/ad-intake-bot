import { logger } from "./logger.js";

/**
 * Wrap a promise with a timeout
 * @param {Promise} promise - The promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds (default 30000ms = 30s)
 * @param {string} operationName - Name of operation for logging
 * @returns {Promise}
 */
export function withTimeout(promise, timeoutMs = 30000, operationName = 'API call') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => {
        const error = new Error(`${operationName} timeout after ${timeoutMs}ms`);
        error.code = 'TIMEOUT';
        reject(error);
      }, timeoutMs)
    )
  ]);
}

/**
 * Safe timeout for external API calls
 */
export const API_TIMEOUTS = {
  OPENAI_CHAT: 30000,      // 30s for chat completions
  OPENAI_EMBEDDING: 15000,  // 15s for embeddings
  FILE_UPLOAD: 60000,        // 60s for file operations
  DATABASE: 10000            // 10s for DB queries
};
