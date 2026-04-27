# История версий (Changelog)

Все значимые релизы проекта «Честная Подписка» фиксируются здесь.

## [1.2.2] – В разработке
### ♿ Полный аудит доступности (WCAG 2.1 AA)

#### Accessibility
- **Семантическая разметка**: `<div role="main">` → `<main>`, `<div>` → `<header>` — корректные HTML5 landmarks.
- **ARIA на формах**: `aria-invalid`, `aria-describedby` на всех полях ввода (SubscriptionFlow, CourseFlow). Ошибки валидации объявляются через `role="alert"`.
- **Контрастность (WCAG 1.4.3)**: Placeholder-ы (`slate-600` → `slate-500`), footer (`white/40` → `white/60`), табы (`text-[10px]` → `text-[11px]`, `slate-500` → `slate-400`).
- **Иконки**: `aria-hidden="true"` и `focusable="false"` на всех 20 SVG-иконках — screen reader больше не зачитывает «path, line, circle».
- **Focus visible**: Кольца `focus-visible:ring-2` на FeatureCard, ToolCard, FAQ accordion buttons.
- **ToolCard**: Конвертирован из `<div onClick>` в `<button>` — теперь доступен с клавиатуры (Tab + Enter).
- **FAQ Accordion**: Полный ARIA-паттерн — `aria-expanded`, `aria-controls`, panel `id`, `role="region"`.
- **Screen Reader**: `aria-live="polite"` на результатах генерации, `aria-busy="true"` + SR-only текст на загрузке.
- **LegalBot Focus Trap**: Полноценная ловушка фокуса в диалоге (Tab cycling, Escape close, auto-focus при открытии).
- **Поиск**: Keyboard navigation (↑↓ Enter Escape), `role="listbox"` / `role="option"` / `aria-selected`.
- **Декоративные элементы**: `aria-hidden="true"` на символе ₽ в формах.
- **Системная интеграция**: `<meta name="color-scheme" content="dark">`.

#### Верификация
- ESLint: 0 errors, 0 warnings.
- TypeScript: 0 errors (`tsc --noEmit`).
- Тесты: 338/338 passed, 42 файла.
- Vite build: success (390 modules).

## [1.2.1] – 2026-04-26
### 🛡️ Security Hardening, Production-Grade Testing и Performance Optimization

#### 🔐 Безопасность
- **Webhook Authentication**: Верификация входящих запросов через `X-Telegram-Bot-Api-Secret-Token` для предотвращения несанкционированных административных действий.
- **IP-хэширование (HMAC-SHA-256)**: IP-адреса пользователей хэшируются с помощью HMAC с секретным ключом (`IP_HASH_SECRET`) перед передачей в любые системы мониторинга.
- **API-ключи в заголовках**: Gemini API-ключ перенесён из URL-параметров в защищённые HTTP-заголовки (`x-goog-api-key`).
- **Structured JSON Logging**: Все серверные логи переведены на `JSON.stringify` для безопасного мониторинга.

#### ✅ Тестирование: 133 → 338 тестов (+205)
- **42 тест-файла** с покрытием всех слоёв: API-эндпоинты, hooks, utilities, services.
- **Новые API-тесты**: `assistant.test.ts`, `generateClaim.test.ts`, `radar.test.ts`, `reportPattern.test.ts`, `chatStatus.test.ts`, `tgWebhook.test.ts`, `requestLimit.test.ts`.
- **Новые hook-тесты**: `useChatStreaming`, `useChatHistory`, `useChatLimits`, `useClaimFlow`, `useCourseFlow`, `useSimulator`, `useRadar`, `useFocusTrap`.
- **Новые utility-тесты**: `hashIp`, `downloadWord`, `escapeHtml`, `fuzzyMatch`, `preload`, `fetchWithRetry`, `format`, `sanitize`.
- **E2E (Playwright)**: 12 smoke-тестов — навигация, LegalBot, валидация форм, accessibility.
- **Coverage thresholds**: `lines: 70%`, `branches: 55%`, `functions: 55%`, `statements: 70%` — проверяются в CI.

#### ⚡ Производительность
- **`docx` Dynamic Import**: Библиотека DOCX (407 KB) вынесена из начального бандла — загружается **только при клике на кнопку скачивания**. Initial bundle: −407 KB.
- **Удалён `string-strip-html`**: Заменён на 1-строчный regex. Чанк LegalBot: **95 KB → 21 KB** (−78%).
- **Lazy Analytics**: `@vercel/analytics` и `@vercel/speed-insights` обёрнуты в `React.lazy` — не блокируют FCP.
- **Redis `enableAutoPipelining`**: Все 8 инстансов Redis используют auto-pipelining для батчинга конкурентных операций (−30-50% latency).
- **`Cache-Control` для `/api/chatStatus`**: `private, max-age=10, stale-while-revalidate=30` — снижает Redis RTT при повторных открытиях чата.
- **Speculation Rules API**: Добавлен `eagerness: "moderate"` — Chrome предзагружает страницы при наведении курсора (>200ms).
- **PWA Workbox**: Добавлены стратегии `NetworkFirst` для `/api/chatStatus` (offline fallback) и `StaleWhileRevalidate` для Google Fonts.
- **Bundle Visualizer**: Интегрирован `rollup-plugin-visualizer` — генерирует `dist/stats.html` с gzip/brotli-анализом при каждой сборке.

#### 🧹 Чистка кода
- Удалён мёртвый Zustand store, дубли гайдов, debug-логи обёрнуты в `import.meta.env.DEV`.
- Модуль-level Redis в `requestLimit.ts` — инстанс создаётся 1 раз при cold start.
- Декларативная `getSeverity()` map вместо цепочки `if/else`.
- Унифицирована обработка `AbortError` во всех hooks.
- ESLint: 0 errors, 0 warnings. TypeScript: 0 errors.
- `.gitignore`: добавлены `test-results/`, `playwright-report/`, `.vercel`; удалены закоммиченные артефакты.

#### 📄 Документация
- Политика конфиденциальности `/privacy`: покрытие 152-ФЗ, трансграничная передача данных.
- Пользовательское соглашение: AI-дисклеймер, ограничения ответственности.
- Обновлены `SECURITY.md`, `README.md`, `CHANGELOG.md`.
- FAQ: 6 → 10 вопросов (сроки ответа, Роспотребнадзор, чарджбэк, оферта vs закон).

## [1.2.0] – 2026-04-04
### 🤖 Эра Gemma 4: Vision, RAG и Поиск
- **💎 Gemma 4 31B-IT**: Основная модель чат-бота обновлена до Gemma 4. Интегрирован нативный `systemInstruction` и глубокая санитаризация истории чата («No Thinking Content»).
- **👁️ AI Vision**: Добавлена поддержка загрузки изображений в чат. Ассистент теперь умеет анализировать скриншоты чеков, личных кабинетов и переписок. Добавлен клиентский resize и вставка из буфера обмена (Ctrl+V).
- **📚 Keyword RAG**: Внедрена система динамического извлечения знаний из `guides.ts`. Бот автоматически получает пошаговые инструкции для 30+ сервисов, если они упоминаются в разговоре.
- **🌐 Google Search Grounding**: Включена поддержка инструментов поиска Google для Gemma 4 – ассистент может проверять актуальные юридические данные в реальном времени.
- **🔋 Масштабирование**: Лимит запросов к чат-боту увеличен с 10 до **15 в сутки**.
- **🛡️ UX-оптимизации**: Видимый сброс капчи Turnstile при истечении токена, оптимизированное хранение изображений в `localStorage` (удаление дублей base64).


## [1.1.2] – 2026-03-27
### 🔍 Линтинг, Структурированные данные и Надёжность
- **⚙️ ESLint + Prettier**: Настроен ESLint 9 (Flat Config) с `@typescript-eslint/recommended` и `react-hooks/rules-of-hooks`. Добавлен Prettier для единообразного форматирования. Шаг `lint` добавлен в CI.
- **🔍 JSON-LD**: Добавлены структурированные данные Schema.org на 4 страницы: `WebApplication` (Dashboard, SubscriptionFlow, CourseFlow) и `ItemList` (GuidesView). Google теперь может показывать Rich Snippets.
- **🛡️ Error handling**: Устранены пустые `catch {}` в `tgWebhook.ts` (2 шт). Добавлена защита `res.json().catch()` в `radarService.ts` – теперь ошибки парсинга JSON дают понятное сообщение вместо `Unexpected token <`.
- **🗺️ Sitemap**: Добавлены `<lastmod>` даты в `sitemap.xml` для приоритизации индексации.

## [1.1.1] – 2026-03-27
### 🛠 Качество кода и инфраструктура
- **🔧 Type Safety**: Устранены все `any` в серверных обработчиках (`api/radar.ts`, `api/tgWebhook.ts`). Добавлены типы `RadarStoredData`, `TelegramUpdate`, `TelegramMessage`, `TelegramCallbackQuery`. Ref-ы Turnstile типизированы через `TurnstileInstance`.
- **♿ Accessibility**: Добавлены `aria-label` на все навигационные элементы (`MobileTabBar`, `AppHeader`, `SearchInput`). Desktop-навигация обёрнута в семантический `<nav>`.
- **🔍 SEO**: Добавлены `og:image`, `og:url`, `og:locale`, `og:site_name` и `<link rel="canonical">` в `index.html`. Компонент `<SEO>` получил корректный URL по умолчанию.
- **⚙️ CI/CD**: Пайплайн теперь включает шаг `npm run build` – сборка проверяется на каждом PR. Добавлен динамический CI-бейдж в README.
- **🧹 CSS**: Удалён конфликтующий `color: #ffffff` из `index.css` (дублировал Tailwind-класс на `<body>`).
- **📝 Документация**: Типы `ClaimData`/`CourseData` задокументированы – описана архитектурная причина отличия клиентских интерфейсов от серверных Zod-схем.

## [1.1.0] – 2026-03-20
### 🚀 Новые возможности и улучшения
- **📡 Полноценный Народный Радар**: Лента алертов переведена на реальную БД (Upstash Redis). Теперь любые жалобы защищены Turnstile-капчей и в ту же секунду дублируются дежурным в Telegram. Добавлена живая фильтрация по категориям без перезагрузок.
- **🕵️‍♂️ Глобальная актуализация Базы Знаний (Редакция 2026)**:
  - Проведена масштабная юридическая проверка и обновление гайдов для **33 сервисов**, добавлены новые скрытые ловушки (дарк-паттерны).
  - **Экосистемы и Кино:** Актуализированы схемы отмен Яндекс.Плюс, СберПрайм, Ozon, ivi, Okko с учетом мульти-экранов удержания.
  - **Шэринг и Сервисы:** В каталог добавлены подробные инструкции для Whoosh, Urent, Telegram Premium, Boosty, Авито.
  - **EdTech (Курсы):** Полностью переписан процесс расторжения договоров со школами (Skillbox, Фоксфорд, Нетология, Яндекс Практикум, Skyeng, Синергия и др.). Развеян миф о "законных штрафах в 30%" – гайды теперь жестко опираются на ст. 32 ЗоЗПП и ст. 782 ГК РФ (через запрос детализации ФПР).
- **🔎 Умный Поиск**: В каталог внедрен текстовый быстрый поиск с поддержкой `fuzzy search` и алиасов.
- **🛡️ Новые API & Security**: Добавлен Serverless Endpoint `reportPattern` для репорта новых уловок маркетологов напрямую в Telegram, с прикрученным Rate Limiting (Upstash) и валидацией данных.
- **✅ Надежность тестирования**: Покрытие юнит-тестами для новых хуков и API существенно увеличено. Теперь в Continuous Integration стабильно проходят **185** тестов.

## [1.0.0] – 2026-03-19
### 🎉 Первый публичный релиз (Launch Version)
Официальный старт проекта «Честная Подписка» – бесплатного ИИ-навигатора для возврата денег за подписки и онлайн-курсы. 

**Основные возможности (Features):**
- 🤖 **Интеллектуальный генератор претензий**: Автоматическое составление юридически грамотных документов на основе ст. 32 ЗоЗПП и ст. 782 ГК РФ.
- 🎭 **Настройка тональности**: Выбор между «Мягким» (конструктивным) и «Жёстким» (ультимативным) форматом общения с поддержкой.
- 🎮 **Тренажёр "Тёмных паттернов" (Simulator)**: Интерактивная веб-игра для обучения пользователей распознаванию уловок маркетологов (скрытые кнопки отмены, визуальный обман).
- 📡 **Народный Радар**: Тепловая карта жалоб на популярные сервисы (Яндекс Плюс, ivi, Skillbox и др.).
- 📚 **База знаний (Guides)**: 27 пошаговых инструкций по отписке от конкретных платформ.
- 📄 **Экспорт документов**: Генерация готовых `.docx` файлов («Скачать Word») для отправки заказным письмом или по email.

**Архитектура и Безопасность (Enterprise-Grade Security):**
- 🔒 **Модель Dual License**: Код распространяется по лицензии CC BY-NC 4.0 (с запретом коммерческого использования без покупки лицензии).
- 🛡️ **Защита от AI-инъекций (Prompt Injection)**: Многоуровневая санитаризация ввода перед отправкой в Gemini API (каскад: Gemini 3.1 Flash Lite → Gemma 4 26B).
- 🚦 **Rate Limiting & Anti-Bot**: Интеграция Cloudflare Turnstile и Upstash Redis (Fail-Closed алгоритм для защиты от DDoS).
- 🧱 **Strict CSP & CORS**: Жёсткие политики безопасности в `vercel.json` для защиты от XSS.
- ⚡ **Zero-JS Canvas Animations**: Максимально оптимизированные фоны на WebGL/Canvas с использованием `IntersectionObserver` (0% нагрузки на GPU вне зоны видимости).
- 📱 **PWA Ready**: Установка на смартфоны и кэширование ресурсов с помощью Service Workers.

*(Это стабильная версия 1.0.0, покрытая 124 юнит-тестами с успешным прохождением).*
