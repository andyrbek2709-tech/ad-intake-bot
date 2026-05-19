# Client History & Reporting

## Что это?

Система для менеджеров видеть:
- ✅ **Полную историю каждого клиента** (все заказы, общения, лиды)
- ✅ **Временную ленту** (что, когда происходило)
- ✅ **Отчеты** (дневные, недельные)

## Клиент ID

Каждый клиент идентифицируется по **telegram_user_id**:
```
/profile 123456789  → История клиента
/timeline 123456789 → Лента активности
```

---

## Команды для менеджера

### 1. **Профиль клиента**
```
/profile <telegram_user_id>
```

Возвращает:
```
👤 Клиент ID: 123456789

📊 Статистика:
  • Общений: 5
  • Заказов: 3
  • Лидов: 2

🔥 Оценки лидов:
  • HOT (≥70): 1
  • WARM (40-69): 1
  • COLD (<40): 0

📅 Активность:
  • Первый контакт: 19.05.2026 10:30
  • Последний контакт: 19.05.2026 14:15
```

### 2. **Лента активности**
```
/timeline <telegram_user_id>
```

Возвращает последние 10 событий:
```
📱 19.05 14:15 — Общение (3 сообщения, ru)
📦 19.05 13:50 — Заказ: дизайн (new)
🔔 19.05 13:30 — Лид: WARM (65 баллов, new)
📱 18.05 18:20 — Общение (2 сообщения, kk)
```

### 3. **Дневной отчет**
```
/report_today
```

Возвращает статистику за текущий день:
```
📅 Дневной отчет: 2026-05-19

📱 Общения:
  • Всего: 12
  • Статусы: active: 8, completed: 4

📦 Заказы:
  • Всего: 5
  • Статусы: new: 3, in_progress: 2
  • Бюджет: $2500

🔔 Лиды:
  • Всего: 7
  • 🔥 HOT: 2
  • 🟡 WARM: 3
  • 🔵 COLD: 2
```

### 4. **Недельный отчет**
```
/report_week
```

Возвращает статистику за последние 7 дней:
```
📊 Недельный отчет: 2026-05-12 to 2026-05-19

📱 Общения:
  • Всего: 84
  • В среднем в день: 12

📦 Заказы:
  • Всего: 35
  • В среднем в день: 5
  • Сумма: $12500

🔔 Лиды:
  • Всего: 49
  • 🔥 HOT: 14
  • 🟡 WARM: 21
  • 🔵 COLD: 14
```

---

## Структура данных

### Client Profile
```javascript
{
  telegram_user_id: 123456789,
  total_conversations: 5,
  total_orders: 3,
  total_leads: 2,
  first_contact: "2026-05-15T10:30:00Z",
  last_contact: "2026-05-19T14:15:00Z",
  stats: {
    hot_leads: 1,
    warm_leads: 1,
    cold_leads: 0,
    completed_orders: 1,
    pending_orders: 2
  },
  conversations: [...],
  orders: [...],
  leads: [...]
}
```

### Timeline Item
```javascript
{
  type: 'conversation' | 'order' | 'lead',
  timestamp: "2026-05-19T14:15:00Z",
  status: 'active' | 'completed' | 'new',
  // + type-specific fields
}
```

---

## Использование в коде

### Получить профиль клиента
```javascript
import { getClientProfile, formatClientProfile } from '../services/clientHistory.js';

const profile = await getClientProfile(telegramUserId);
const formatted = formatClientProfile(profile);

await ctx.reply(formatted);
```

### Получить ленту активности
```javascript
import { getClientTimeline, formatTimeline } from '../services/clientHistory.js';

const timeline = await getClientTimeline(telegramUserId);
const formatted = formatTimeline(timeline);

await ctx.reply(formatted);
```

### Получить дневной отчет
```javascript
import { getDailyReport, formatDailyReport } from '../services/reporting.js';

const report = await getDailyReport();
const formatted = formatDailyReport(report);

await ctx.reply(formatted);
```

### Получить недельный отчет
```javascript
import { getWeeklyReport, formatWeeklyReport } from '../services/reporting.js';

const report = await getWeeklyReport();
const formatted = formatWeeklyReport(report);

await ctx.reply(formatted);
```

---

## Интеграция в handlers.js

Добавить команды:

```javascript
// Get client profile
bot.command('profile', async (ctx) => {
  const telegramId = ctx.message.text.split(' ')[1];
  if (!telegramId) {
    return ctx.reply('Использование: /profile <telegram_user_id>');
  }
  
  const profile = await getClientProfile(telegramId);
  const formatted = formatClientProfile(profile);
  
  await ctx.reply(formatted, { parse_mode: 'Markdown' });
});

// Get client timeline
bot.command('timeline', async (ctx) => {
  const telegramId = ctx.message.text.split(' ')[1];
  if (!telegramId) {
    return ctx.reply('Использование: /timeline <telegram_user_id>');
  }
  
  const timeline = await getClientTimeline(telegramId);
  const formatted = formatTimeline(timeline);
  
  await ctx.reply(formatted);
});

// Daily report
bot.command('report_today', async (ctx) => {
  const report = await getDailyReport();
  const formatted = formatDailyReport(report);
  
  await ctx.reply(formatted, { parse_mode: 'Markdown' });
});

// Weekly report
bot.command('report_week', async (ctx) => {
  const report = await getWeeklyReport();
  const formatted = formatWeeklyReport(report);
  
  await ctx.reply(formatted, { parse_mode: 'Markdown' });
});
```

---

## Возможные расширения

- 📈 Графики в отчетах (через bots.business или charts API)
- 📧 Автоматические отчеты по email
- 📊 Экспорт в CSV/Excel
- 🔔 Alerts при важных событиях (новый HOT лид, большой заказ)
- 🎯 Прогнозы (когда ожидать конверсию)

---

## CRM Интеграции (будущее)

Когда решишь интегрировать CRM:
- История клиентов уже подготовлена
- Просто добавить `exportToExternal()` в reporting.js
- Плаг-энд-плай архитектура

```javascript
// Будущее:
export async function exportToExternal(report, platform) {
  switch(platform) {
    case 'amocrm': return exportToAmoCRM(report);
    case 'pipedrive': return exportToPipedrive(report);
    // ...
  }
}
```
