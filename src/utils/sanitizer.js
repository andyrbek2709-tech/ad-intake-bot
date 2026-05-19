/**
 * Input Sanitization & Validation
 * Защита от prompt injection и bad inputs
 */

import { logger } from "./logger.js";

// Danger patterns that might indicate prompt injection
const DANGER_PATTERNS = [
  /ignore\s+(previous|system|instructions)/i,
  /you\s+are\s+now/i,
  /forget\s+(everything|all)/i,
  /new\s+(task|instruction)/i,
  /respond\s+as\s+if/i,
  /pretend\s+you\s+are/i,
  /act\s+like\s+you\s+are/i
];

/**
 * Sanitize user message before sending to LLM
 * @param {string} input - Raw user input
 * @returns {object} { sanitized, isSuspicious, reason }
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return {
      sanitized: '',
      isSuspicious: false,
      reason: 'empty_input'
    };
  }

  const trimmed = input.trim();
  
  // Check length (prevent token spam)
  if (trimmed.length > 10000) {
    return {
      sanitized: trimmed.substring(0, 10000),
      isSuspicious: true,
      reason: 'too_long'
    };
  }

  // Check for danger patterns
  for (const pattern of DANGER_PATTERNS) {
    if (pattern.test(trimmed)) {
      logger.warn('Suspicious input detected', {
        pattern: pattern.toString(),
        input: trimmed.substring(0, 100)
      });
      
      return {
        sanitized: trimmed,
        isSuspicious: true,
        reason: 'prompt_injection_attempt'
      };
    }
  }

  // Check for excessive special characters
  const specialChars = trimmed.match(/[!@#$%^&*()+=\[\]{};:'",.<>?\\|`~]/g) || [];
  if (specialChars.length > trimmed.length * 0.3) {
    return {
      sanitized: trimmed,
      isSuspicious: true,
      reason: 'too_many_special_chars'
    };
  }

  return {
    sanitized: trimmed,
    isSuspicious: false,
    reason: 'clean'
  };
}

/**
 * Validate user ID
 */
export function validateUserId(userId) {
  if (!userId) return false;
  const id = parseInt(String(userId), 10);
  return !isNaN(id) && id > 0 && id < 9999999999;
}

/**
 * Validate service type
 */
export function validateServiceType(type) {
  const valid = [
    'design', 'branding', 'logo',
    'video', 'animation', 'editing',
    'print', 'polygraph', 'packaging',
    'web', 'development',
    'social', 'content',
    'other'
  ];
  return valid.includes(String(type).toLowerCase());
}

/**
 * Validate language code
 */
export function validateLangCode(lang) {
  return ['ru', 'kk', 'en'].includes(String(lang).toLowerCase());
}
