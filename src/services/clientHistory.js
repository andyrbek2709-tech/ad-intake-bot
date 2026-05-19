/**
 * Client History & Profile
 * Полная история каждого клиента для менеджеров
 */

import { supabase } from "./supabase.js";
import { logger } from "../utils/logger.js";

/**
 * Get complete client profile with all orders and interactions
 */
export async function getClientProfile(telegramUserId) {
  try {
    // Get all conversations
    const { data: conversations, error: convErr } = await supabase
      .from("conversations")
      .select("*")
      .eq("telegram_user_id", String(telegramUserId))
      .order("created_at", { ascending: false });

    if (convErr) throw convErr;

    // Get all orders
    const { data: orders, error: ordErr } = await supabase
      .from("orders")
      .select("*")
      .eq("telegram_user_id", String(telegramUserId))
      .order("created_at", { ascending: false });

    if (ordErr) throw ordErr;

    // Get all leads
    const { data: leads, error: leadErr } = await supabase
      .from("leads")
      .select("*")
      .eq("telegram_user_id", String(telegramUserId))
      .order("created_at", { ascending: false });

    if (leadErr) throw leadErr;

    // Build profile
    return {
      telegram_user_id: telegramUserId,
      total_conversations: conversations?.length || 0,
      total_orders: orders?.length || 0,
      total_leads: leads?.length || 0,
      first_contact: conversations?.[conversations.length - 1]?.created_at,
      last_contact: conversations?.[0]?.created_at,
      conversations,
      orders,
      leads,
      // Calculated stats
      stats: {
        hot_leads: leads?.filter(l => l.lead_score >= 70).length || 0,
        warm_leads: leads?.filter(l => l.lead_score >= 40 && l.lead_score < 70).length || 0,
        cold_leads: leads?.filter(l => l.lead_score < 40).length || 0,
        completed_orders: orders?.filter(o => o.status === 'completed').length || 0,
        pending_orders: orders?.filter(o => ['new', 'in_progress'].includes(o.status)).length || 0
      }
    };
  } catch (err) {
    logger.error("Failed to get client profile", { 
      telegramUserId, 
      error: err.message 
    });
    return null;
  }
}

/**
 * Get timeline for a client (combined activity)
 */
export async function getClientTimeline(telegramUserId, limit = 50) {
  const profile = await getClientProfile(telegramUserId);
  if (!profile) return [];

  const timeline = [];

  // Add conversation events
  profile.conversations?.forEach(conv => {
    timeline.push({
      type: 'conversation',
      timestamp: conv.created_at,
      status: conv.status,
      messages_count: conv.history?.length || 0,
      lang: conv.lang
    });
  });

  // Add order events
  profile.orders?.forEach(ord => {
    timeline.push({
      type: 'order',
      timestamp: ord.created_at,
      status: ord.status,
      service_type: ord.service_type,
      budget: ord.budget
    });
  });

  // Add lead events
  profile.leads?.forEach(lead => {
    timeline.push({
      type: 'lead',
      timestamp: lead.created_at,
      status: lead.status,
      score: lead.lead_score,
      score_tier: lead.lead_score >= 70 ? 'hot' : lead.lead_score >= 40 ? 'warm' : 'cold'
    });
  });

  // Sort by timestamp descending
  return timeline
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Format client profile for manager view
 */
export function formatClientProfile(profile) {
  if (!profile) return "❌ Клиент не найден";

  const lines = [
    `👤 **Клиент ID:** ${profile.telegram_user_id}`,
    ``,
    `📊 **Статистика:**`,
    `  • Общений: ${profile.total_conversations}`,
    `  • Заказов: ${profile.total_orders}`,
    `  • Лидов: ${profile.total_leads}`,
    ``,
    `🔥 **Оценки лидов:**`,
    `  • HOT (≥70): ${profile.stats.hot_leads}`,
    `  • WARM (40-69): ${profile.stats.warm_leads}`,
    `  • COLD (<40): ${profile.stats.cold_leads}`,
    ``,
    `📅 **Активность:**`,
    `  • Первый контакт: ${formatDate(profile.first_contact)}`,
    `  • Последний контакт: ${formatDate(profile.last_contact)}`,
    ``,
    `📋 **Последние действия:**`,
    `  (используй /timeline <user_id> для подробной ленты)`
  ];

  return lines.join('\n');
}

/**
 * Format timeline for manager view
 */
export function formatTimeline(timeline) {
  if (!timeline || timeline.length === 0) return "❌ Нет активности";

  const lines = timeline.slice(0, 10).map(item => {
    const time = formatDate(item.timestamp);
    
    switch (item.type) {
      case 'conversation':
        return `📱 ${time} — Общение (${item.messages_count} сообщений, ${item.lang})`;
      case 'order':
        return `📦 ${time} — Заказ: ${item.service_type} (${item.status})`;
      case 'lead':
        return `🔔 ${time} — Лид: ${item.score_tier.toUpperCase()} (${item.score} баллов, ${item.status})`;
      default:
        return `• ${time} — ${item.type}`;
    }
  });

  return lines.join('\n');
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
