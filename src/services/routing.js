/**
 * Intelligent Order Routing
 * Распределяет заказы менеджерам на основе:
 * - Языка клиента
 * - Типа услуги
 * - Специализации менеджера
 * - Текущей нагрузки
 */

import { supabase } from "./supabase.js";
import { logger } from "../utils/logger.js";

/**
 * Manager profile structure:
 * {
 *   id: number,
 *   telegram_id: number,
 *   name: string,
 *   chat_id: number,
 *   languages: ['ru', 'kk', 'en'],
 *   specializations: ['design', 'video', 'polygraph'],
 *   max_concurrent: 5,
 *   status: 'active' | 'busy' | 'inactive'
 * }
 */

const MANAGER_CONFIG = process.env.MANAGER_CONFIG
  ? JSON.parse(process.env.MANAGER_CONFIG)
  : null;

/**
 * Get manager by language and service type
 * @param {string} lang - Client language (ru/kk/en)
 * @param {string} serviceType - Service type from order
 * @returns {object} Manager config or null
 */
export async function findManagerForOrder({ lang, serviceType, telegramUserId }) {
  // If manager config provided, use routing
  if (MANAGER_CONFIG) {
    return routeByConfig(lang, serviceType);
  }

  // Fallback: use default manager
  return getDefaultManager();
}

/**
 * Route by MANAGER_CONFIG
 * Priority:
 * 1. Exact match (language + specialization)
 * 2. Language match
 * 3. Specialization match
 * 4. Default/fallback
 */
function routeByConfig(lang, serviceType) {
  const managers = MANAGER_CONFIG.managers || [];

  if (managers.length === 0) {
    logger.warn("No managers configured in MANAGER_CONFIG");
    return null;
  }

  // Filter by language
  const byLang = managers.filter((m) =>
    m.languages?.includes(lang) || m.languages?.includes("*")
  );

  if (byLang.length === 0) {
    logger.warn(`No manager for language: ${lang}, using fallback`);
    return managers[0]; // Fallback to first
  }

  // Filter by specialization
  const bySpec = byLang.filter((m) =>
    m.specializations?.includes(serviceType) || m.specializations?.includes("*")
  );

  if (bySpec.length > 0) {
    // Found exact match - return least busy
    return selectLeastBusy(bySpec);
  }

  // No specialization match - return least busy by language
  return selectLeastBusy(byLang);
}

/**
 * Select manager with lowest current load
 */
function selectLeastBusy(managers) {
  if (managers.length === 0) return null;
  if (managers.length === 1) return managers[0];

  // Simple: count current leads per manager
  // In production: fetch from DB
  return managers.reduce((prev, curr) => {
    const prevLoad = prev.current_leads || 0;
    const currLoad = curr.current_leads || 0;
    return currLoad < prevLoad ? curr : prev;
  });
}

/**
 * Get default manager from environment
 */
function getDefaultManager() {
  const chatId = process.env.MANAGER_CHAT_ID;
  const userId = process.env.MANAGER_TELEGRAM_USER_ID;

  if (!chatId) {
    logger.error("No MANAGER_CHAT_ID configured");
    return null;
  }

  return {
    name: "Default Manager",
    chat_id: parseInt(chatId, 10),
    telegram_id: userId ? parseInt(userId, 10) : null,
    languages: ["*"],
    specializations: ["*"]
  };
}

/**
 * Log routing decision
 */
export function logRouting({ lang, serviceType, selectedManager }) {
  logger.info("Order routed", {
    lang,
    serviceType,
    manager: selectedManager?.name,
    chatId: selectedManager?.chat_id
  });
}

/**
 * MANAGER_CONFIG Example:
 * {
 *   "managers": [
 *     {
 *       "name": "Айдар (казахский)",
 *       "chat_id": -1001234567890,
 *       "telegram_id": 123456789,
 *       "languages": ["kk", "ru"],
 *       "specializations": ["design", "branding"],
 *       "max_concurrent": 5,
 *       "status": "active"
 *     },
 *     {
 *       "name": "Мария (видео)",
 *       "chat_id": -1009876543210,
 *       "telegram_id": 987654321,
 *       "languages": ["ru", "en"],
 *       "specializations": ["video", "animation"],
 *       "max_concurrent": 3,
 *       "status": "active"
 *     },
 *     {
 *       "name": "Главный (backup)",
 *       "chat_id": -1005555555555,
 *       "telegram_id": 555555555,
 *       "languages": ["*"],
 *       "specializations": ["*"],
 *       "max_concurrent": 10,
 *       "status": "active"
 *     }
 *   ]
 * }
 */
