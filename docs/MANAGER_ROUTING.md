# Manager Routing — Умное распределение заказов

## Что это?

Система автоматически маршрутизирует входящие заказы **нужному менеджеру** на основе:
- 🌐 **Языка** клиента (русский, казахский, английский)
- 📋 **Типа услуги** (дизайн, видео, полиграфия)
- 👤 **Специализации** менеджера
- 💼 **Текущей нагрузки** (кто менее занят)

## Примеры

### Сценарий 1: Казахский клиент, дизайн логотипа
```
Клиент: Казахский язык, услуга: дизайн
БОТ ВЫБИРАЕТ: Айдар (говорит на казахском, специалист по дизайну)
ЗАКАЗ ИДЕТ: к Айдару
```

### Сценарий 2: Русский клиент, видео
```
Клиент: Русский язык, услуга: видео
БОТ ВЫБИРАЕТ: Мария (русский + видео специалист)
ЗАКАЗ ИДЕТ: к Марии
```

### Сценарий 3: Неизвестная комбинация
```
Клиент: Английский язык, полиграфия
БОТ ВЫБИРАЕТ: Главный менеджер (handle любой язык/услугу)
ЗАКАЗ ИДЕТ: к главному менеджеру
```

---

## Настройка

### 1. Определи менеджеров в Railway ENV

Переменная: `MANAGER_CONFIG` (JSON строка)

```json
{
  "managers": [
    {
      "name": "Айдар (казахский, дизайн)",
      "chat_id": -1001234567890,
      "telegram_id": 123456789,
      "languages": ["kk", "ru"],
      "specializations": ["design", "branding", "logo"],
      "max_concurrent": 5,
      "status": "active"
    },
    {
      "name": "Мария (видео)",
      "chat_id": -1009876543210,
      "telegram_id": 987654321,
      "languages": ["ru", "en"],
      "specializations": ["video", "animation", "editing"],
      "max_concurrent": 3,
      "status": "active"
    },
    {
      "name": "Сергей (полиграфия)",
      "chat_id": -1005555555555,
      "telegram_id": 555555555,
      "languages": ["ru", "kk"],
      "specializations": ["print", "polygraph", "packaging"],
      "max_concurrent": 4,
      "status": "active"
    },
    {
      "name": "Главный (backup)",
      "chat_id": -1008888888888,
      "telegram_id": 888888888,
      "languages": ["*"],
      "specializations": ["*"],
      "max_concurrent": 10,
      "status": "active"
    }
  ]
}
```

### 2. Добавь MANAGER_CONFIG в Railway

```bash
# Railway Dashboard → Variables → Add
MANAGER_CONFIG = '{"managers": [...]}'
```

### 3. Используй в коде

Файл: `src/bot/handlers.js`

```javascript
import { findManagerForOrder, logRouting } from '../services/routing.js';

// При получении заказа:
const manager = await findManagerForOrder({
  lang: clientLanguage,  // 'ru', 'kk', 'en'
  serviceType: orderData.service_type,  // 'design', 'video', etc
  telegramUserId: ctx.from.id
});

logRouting({ 
  lang: clientLanguage, 
  serviceType: orderData.service_type, 
  selectedManager: manager 
});

// Отправить менеджеру:
await ctx.telegram.sendMessage(manager.chat_id, notification);
```

---

## Приоритет маршрутизации

1. **Exact Match** — язык И специализация совпадают
   - Пример: русский + видео → Мария (русский + видео)
   
2. **Language Match** — только язык совпадает
   - Пример: казахский + видео → Айдар (казахский, но не видео)
   
3. **Specialization Match** — только специализация совпадает
   - Пример: английский + дизайн → Айдар (дизайн, но не английский)
   
4. **Fallback** — Главный менеджер (languages: ["*"], specializations: ["*"])
   - Пример: неизвестный язык + неизвестная услуга

---

## Поля конфигурации

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|---------|
| `name` | string | ✅ | Имя менеджера (для логов) |
| `chat_id` | number | ✅ | ID чата в Telegram (для заказов) |
| `telegram_id` | number | ❌ | Telegram user ID (для проверок) |
| `languages` | string[] | ✅ | Языки: `["ru", "kk", "en", "*"]` |
| `specializations` | string[] | ✅ | Специализации: `["design", "video", "print", "*"]` |
| `max_concurrent` | number | ❌ | Макс одновременные заказы |
| `status` | string | ❌ | `"active"` (только активные) |

### Коды языков:
- `ru` — Русский
- `kk` — Казахский
- `en` — Английский
- `*` — Любой

### Коды специализаций:
- `design` — Дизайн, логотипы, брендинг
- `video` — Видео, монтаж, анимация
- `print` / `polygraph` — Полиграфия
- `web` — Веб-разработка
- `social` — Соцсети, контент
- `*` — Любая услуга

---

## Без конфигурации (fallback)

Если `MANAGER_CONFIG` не задан, используется старый способ:

```bash
MANAGER_CHAT_ID = -1001234567890
MANAGER_TELEGRAM_USER_ID = 123456789
```

Все заказы идут одному менеджеру.

---

## Логирование

При каждом маршрутировании бот логирует:

```json
{
  "level": "INFO",
  "msg": "Order routed",
  "lang": "kk",
  "serviceType": "design",
  "manager": "Айдар (казахский, дизайн)",
  "chatId": -1001234567890,
  "ts": "2026-05-19T13:33:00Z"
}
```

Используй эти логи для:
- Отладки маршрутизации
- Анализа нагрузки на менеджеров
- Выявления узких мест

---

## Пример в Railway

```yaml
# .env на Railway
MANAGER_CONFIG='{"managers":[{"name":"Айдар","chat_id":-1001234567890,"languages":["kk","ru"],"specializations":["design"]},{"name":"Мария","chat_id":-1009876543210,"languages":["ru","en"],"specializations":["video"]},{"name":"Главный","chat_id":-1008888888888,"languages":["*"],"specializations":["*"]}]}'
```

---

## Будущие улучшения

- ✅ Маршрутизация по языку/специализации
- 🔲 Динамическая нагрузка (count leads per manager)
- 🔲 Расписание менеджеров (когда в сети)
- 🔲 Переквалификация (если одного менеджера нет)
- 🔲 Dashboard с метриками маршрутизации
