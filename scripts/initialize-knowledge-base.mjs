#!/usr/bin/env node

/**
 * Initialize Knowledge Base with sample data
 * Run this once to populate the KB with initial service descriptions
 */

import dotenv from "dotenv";
import { supabase } from "../src/services/supabase.js";
import { createEmbedding } from "../src/services/openai.js";

dotenv.config();

const SAMPLE_KNOWLEDGE = [
  {
    title: "Услуга: Дизайн логотипа",
    category: "service",
    lang: "ru",
    content: `
Дизайн логотипа — создание уникального визуального символа вашего бренда.

ПРОЦЕСС:
- Брифинг и обсуждение видения (1 день)
- Создание 3-5 вариантов концепций (3-4 дня)
- Выбор направления и доработки (2-3 дня)
- Финальные правки и поставка (1 день)

СТОИМОСТЬ: от 500-1500$ (зависит от сложности и количества правок)

ВКЛЮЧЕНО:
- Консультация дизайнера
- 3 концептуальных варианта
- Неограниченное количество правок выбранного варианта
- Файлы в форматах: PNG, SVG, PDF, AI

ПРИМЕЧАНИЕ: Сроки могут быть сокращены при срочности (доплата 20-30%)
    `
  },
  {
    title: "Услуга: Веб-дизайн и разработка",
    category: "service",
    lang: "ru",
    content: `
Разработка полнофункционального веб-сайта с дизайном и программированием.

СТАДИИ РАЗРАБОТКИ:
1. Дизайн (5-7 дней) — прототипы, макеты в Figma
2. Frontend разработка (7-10 дней) — верстка, интерактивность
3. Backend разработка (10-14 дней) — сервер, БД, интеграции
4. Тестирование и оптимизация (3-5 дней)
5. Деплой и запуск (1 день)

СТОИМОСТЬ: от 2000-5000$ (для типового сайта 5-10 страниц)

ВКЛЮЧЕНО:
- Дизайн в Figma
- Адаптивный дизайн (мобильные, планшеты, десктопы)
- SEO оптимизация
- SSL сертификат
- Хостинг на 3 месяца
- 2 месяца бесплатной поддержки

СРОКИ: 4-6 недель для стандартного проекта
    `
  },
  {
    title: "Услуга: Видеопроизводство",
    category: "service",
    lang: "ru",
    content: `
Создание профессиональных видеороликов для маркетинга и рекламы.

ТИПЫ ВИДЕО:
- Проморолик (30-60 сек): 3000-5000$ / 5-7 дней
- Объяснительное видео (2-3 мин): 4000-7000$ / 7-10 дней
- Корпоративное видео (5-10 мин): 7000-15000$ / 10-14 дней
- Пост для соцсетей (15-30 сек): 500-1500$ / 2-3 дня

ПРОЦЕСС:
1. Сценарий и раскадровка (2 дня)
2. Съемка (1-3 дня)
3. Монтаж и спецэффекты (3-5 дней)
4. Цветокоррекция и звук (2 дня)
5. Экспорт и поставка (1 день)

ВКЛЮЧЕНО:
- Сценарий
- Съемка на профессиональную камеру (4K опционально)
- Профессиональный монтаж
- Музыка и звуковой дизайн
- До 2 раундов правок

ПРИМЕЧАНИЕ: Цены зависят от количества актеров, локаций и спецэффектов
    `
  },
  {
    title: "FAQ: Сроки выполнения",
    category: "rule",
    lang: "ru",
    content: `
МИНИМАЛЬНЫЕ СРОКИ ПО УСЛУГАМ:

Дизайн логотипа: 7-10 дней
Веб-дизайн (макет): 5-7 дней
Веб-разработка (полный): 4-6 недель
Видео (короткое): 5-7 дней
Видео (полное): 2-4 недели
Иллюстрация: 3-5 дней
Баннеры/социальные картинки: 2-3 дня

УСКОРЕНИЕ:
При срочности работ возможно ускорение на 30-50% с доплатой 20-30%.
Экстренные работы (24-48 часов) возможны только по согласованию.
    `
  },
  {
    title: "FAQ: Методы оплаты",
    category: "rule",
    lang: "ru",
    content: `
ДОСТУПНЫЕ СПОСОБЫ ОПЛАТЫ:

1. Банковский перевод (для юридических лиц)
   - SWIFT переводы
   - Казахстанские банки

2. Карточка (Visa, Mastercard, Kaspi)
   - Онлайн платежи
   - Комиссия 2-3%

3. Криптовалюта (Bitcoin, Ethereum, USDT)
   - Для международных платежей
   - Без комиссий

4. Рассрочка
   - 50% авансом, остаток при сдаче
   - Для проектов > 2000$

ПРОЦЕСС:
1. Счет за работу отправляется после брифинга
2. Авансовый платеж (обычно 50%) до начала работ
3. Остаток при сдаче проекта
    `
  },
  {
    title: "Рекомендация: Контрактование",
    category: "tip",
    lang: "ru",
    content: `
ПЕРЕД НАЧАЛОМ РАБОТ МЫ ВСЕГДА:

✓ Подписываем договор (защита обеих сторон)
✓ Оформляем техническое задание (ТЗ)
✓ Согласуем сроки и бюджет
✓ Определяем процесс проверки и правок
✓ Указываем условия оплаты

СРОКИ НАЧАЛА РАБОТ:
- Обычно работы начинаются после получения авансового платежа
- Договор подписывается в электронном виде (DocuSign или аналог)
- Все коммуникации ведутся в Telegram/Email для удобства
    `
  }
];

async function initializeKB() {
  console.log("🚀 Initializing Knowledge Base...\n");

  for (const item of SAMPLE_KNOWLEDGE) {
    try {
      console.log(`📝 Processing: ${item.title}`);

      // Create embedding for the content
      let embedding = null;
      try {
        const embResult = await createEmbedding(item.content);
        embedding = embResult;
        console.log(`   ✓ Embedding created (${embedding?.length || 0} dims)`);
      } catch (err) {
        console.warn(`   ⚠️ Embedding failed (will use NULL): ${err.message}`);
      }

      // Insert into knowledge_items table
      const { data, error } = await supabase
        .from("knowledge_items")
        .insert({
          title: item.title,
          category: item.category,
          lang: item.lang,
          content: item.content,
          embedding: embedding, // pgvector format
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error(`   ✗ Insert failed: ${error.message}`);
      } else {
        console.log(`   ✓ Saved (ID: ${data?.[0]?.id})\n`);
      }
    } catch (err) {
      console.error(`   ✗ Error: ${err.message}\n`);
    }
  }

  console.log("✅ Knowledge Base initialization complete!");
  console.log("\nNEXT STEPS:");
  console.log("1. Verify data in Supabase: knowledge_items table");
  console.log("2. Add more items as needed: /kb_add command");
  console.log("3. Test search: /kb_search 'дизайн'");
  console.log("4. Monitor KB usage in bot responses");
}

// Run
initializeKB().catch(console.error);
