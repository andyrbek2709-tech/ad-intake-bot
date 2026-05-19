/**
 * Reporting & Analytics
 * Базовая отчетность для менеджеров
 */

import { supabase } from "./supabase.js";
import { logger } from "../utils/logger.js";

/**
 * Get daily report
 */
export async function getDailyReport(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Conversations today
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, status, lang")
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString());

    // Orders today
    const { data: orders } = await supabase
      .from("orders")
      .select("id, status, service_type, budget")
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString());

    // Leads today
    const { data: leads } = await supabase
      .from("leads")
      .select("id, status, lead_score")
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString());

    return {
      date: date.toISOString().split('T')[0],
      conversations: {
        total: conversations?.length || 0,
        by_status: groupBy(conversations || [], 'status'),
        by_lang: groupBy(conversations || [], 'lang')
      },
      orders: {
        total: orders?.length || 0,
        by_status: groupBy(orders || [], 'status'),
        by_service: groupBy(orders || [], 'service_type'),
        total_budget: (orders || []).reduce((sum, o) => {
          const num = parseFloat(o.budget) || 0;
          return sum + num;
        }, 0)
      },
      leads: {
        total: leads?.length || 0,
        by_status: groupBy(leads || [], 'status'),
        hot: leads?.filter(l => l.lead_score >= 70).length || 0,
        warm: leads?.filter(l => l.lead_score >= 40 && l.lead_score < 70).length || 0,
        cold: leads?.filter(l => l.lead_score < 40).length || 0
      }
    };
  } catch (err) {
    logger.error("Failed to generate daily report", { error: err.message });
    return null;
  }
}

/**
 * Get weekly report
 */
export async function getWeeklyReport(endDate = new Date()) {
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);

  try {
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, created_at, status")
      .gte("created_at", startDate.toISOString());

    const { data: orders } = await supabase
      .from("orders")
      .select("id, created_at, status, budget")
      .gte("created_at", startDate.toISOString());

    const { data: leads } = await supabase
      .from("leads")
      .select("id, created_at, status, lead_score")
      .gte("created_at", startDate.toISOString());

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      conversations: {
        total: conversations?.length || 0,
        by_status: groupBy(conversations || [], 'status'),
        daily_average: Math.round((conversations?.length || 0) / 7)
      },
      orders: {
        total: orders?.length || 0,
        by_status: groupBy(orders || [], 'status'),
        total_budget: (orders || []).reduce((sum, o) => sum + (parseFloat(o.budget) || 0), 0),
        daily_average: Math.round((orders?.length || 0) / 7)
      },
      leads: {
        total: leads?.length || 0,
        by_status: groupBy(leads || [], 'status'),
        hot: leads?.filter(l => l.lead_score >= 70).length || 0,
        warm: leads?.filter(l => l.lead_score >= 40 && l.lead_score < 70).length || 0,
        cold: leads?.filter(l => l.lead_score < 40).length || 0
      }
    };
  } catch (err) {
    logger.error("Failed to generate weekly report", { error: err.message });
    return null;
  }
}

/**
 * Format daily report for Telegram
 */
export function formatDailyReport(report) {
  if (!report) return "❌ Не удалось получить отчет";

  const lines = [
    `📅 **Дневной отчет: ${report.date}**`,
    ``,
    `📱 **Общения:**`,
    `  • Всего: ${report.conversations.total}`,
    `  • Статусы: ${JSON.stringify(report.conversations.by_status).replace(/[{}\"]/g, '')}`,
    ``,
    `📦 **Заказы:**`,
    `  • Всего: ${report.orders.total}`,
    `  • Статусы: ${JSON.stringify(report.orders.by_status).replace(/[{}\"]/g, '')}`,
    `  • Бюджет: $${report.orders.total_budget.toFixed(0)}`,
    ``,
    `🔔 **Лиды:**`,
    `  • Всего: ${report.leads.total}`,
    `  • 🔥 HOT: ${report.leads.hot}`,
    `  • 🟡 WARM: ${report.leads.warm}`,
    `  • 🔵 COLD: ${report.leads.cold}`
  ];

  return lines.join('\n');
}

/**
 * Format weekly report for Telegram
 */
export function formatWeeklyReport(report) {
  if (!report) return "❌ Не удалось получить отчет";

  const lines = [
    `📊 **Недельный отчет: ${report.period}**`,
    ``,
    `📱 **Общения:**`,
    `  • Всего: ${report.conversations.total}`,
    `  • В среднем в день: ${report.conversations.daily_average}`,
    ``,
    `📦 **Заказы:**`,
    `  • Всего: ${report.orders.total}`,
    `  • В среднем в день: ${report.orders.daily_average}`,
    `  • Сумма: $${Math.round(report.orders.total_budget)}`,
    ``,
    `🔔 **Лиды:**`,
    `  • Всего: ${report.leads.total}`,
    `  • 🔥 HOT: ${report.leads.hot}`,
    `  • 🟡 WARM: ${report.leads.warm}`,
    `  • 🔵 COLD: ${report.leads.cold}`
  ];

  return lines.join('\n');
}

/**
 * Utility: group array by property
 */
function groupBy(array, key) {
  return array.reduce((acc, item) => {
    const value = item[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}
