<div align="center">
  <img src="./public/logo.webp" width="160" alt="Честная Подписка Лого" />
  <h1>🛡️ Честная Подписка <br/> <sup>(Honest Subscription)</sup></h1>
  
  <p><strong>Бесплатный правовой навигатор и генератор претензий для защиты прав потребителей в цифровой среде.</strong></p>
  
  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React%2019-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
    <a href="https://github.com/tigralint/chestnayapodpiska/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/tigralint/chestnayapodpiska/ci.yml?style=for-the-badge&logo=githubactions&logoColor=white&label=CI" alt="CI" /></a>
    <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/Tests-338_passed-2ea44f?style=for-the-badge&logo=vitest&logoColor=white" alt="Tests" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-Dual_License-blue?style=for-the-badge" alt="License" /></a>
  </p>

  <p>
    <i>Создано в рамках Всероссийского студенческого конкурса <b>«Твой Ход»</b>.</i>
  </p>
</div>

<br/>

> 💡 **Сервис незаконно списал деньги? Онлайн-школа отказывается возвращать оплату? Кнопка отмены спрятана за семью слоями интерфейса?** <br/>
> Корпорации тратят миллионы на UX-дизайнеров, чтобы спрятать отмену подписки. Среднестатистический пользователь часто даже не подозревает о существовании ст. 32 ЗоЗПП РФ. **Мы поможем вернуть ваше.**

«Честная Подписка» – это инструмент, который за **2 минуты** сгенерирует юридически грамотную претензию на возврат денег. Инструмент полностью бесплатен, не требует регистрации и не собирает персональные данные.

---

## 📑 Оглавление
- [✨ Ключевые возможности](#-ключевые-возможности)
- [🏗 Архитектура и Технологии](#-архитектура-и-технологии)
- [🛡 Безопасность и надежность](#-безопасность-и-надежность)
- [⚡ Производительность](#-производительность)
- [🚀 Быстрый старт (Локально)](#-быстрый-старт-локально)
- [🤝 Участие в проекте (Contributing)](#-участие-в-проекте-contributing)
- [⚖️ Лицензия](#️-лицензия)
- [📞 Контакты](#-контакты)

---

## ✨ Ключевые возможности

### 🤖 Интеллектуальный Юридический Ассистент (Gemma 4 + RAG)
Центральный хаб поддержки на базе новейшей модели **Gemma 4 31B-IT**. 
*   **👁️ AI Vision**: Ассистент понимает изображения. Можно загрузить скриншот чека или страницы подписки для автоматического анализа ситуации.
*   **📚 Keyword RAG**: При упоминании конкретных сервисов бот мгновенно получает доступ к пошаговым инструкциям и дарк-паттернам из внутренней базы `guides.ts`.
*   **🌐 Grounding**: Поддержка Google Search для проверки актуальных изменений в законодательстве РФ в реальном времени.
*   **🦾 Тональность**: Генерация документов в «Мягком» или «Жёстком» формате на основе ст. 32 ЗоЗПП и ст. 782 ГК РФ.
*   **🔄 Model Cascade**: Многоуровневый каскад моделей (Gemini 3.1 Flash Lite → Gemini 3 Flash → Gemini 2.5 Flash → Gemma 4 31B-IT) с автоматическим fallback при 429/500 ошибках.

### 🎮 Симулятор Дарк-паттернов
Интерактивный тренажер, обучающий пользователей распознавать уловки дизайнеров:
*   Скрытые кнопки отмены.
*   Психологическое давление ("Вы уверены? Вы потеряете все бонусы!").
*   Подмена понятий и перестановка UI-элементов.
*   *Обучение через игру делает пользователя защищенным в реальных интерфейсах.*

### 📡 Народный радар (Live Analytics)
Система мониторинга массовых списаний на базе **Upstash Redis**.
*   Анонимная передача сигналов о проблемах с сервисами.
*   Визуализация «горячих точек», где прямо сейчас пользователи сталкиваются с трудностями при отмене.

### 📚 Интеллектуальная База Знаний
Каталог детализированных инструкций по отписке от более чем 30 популярных сервисов (Яндекс, Сбер, VK, Skillbox и др.) с удобным поиском и актуальными советами на 2026 год.

---

## 🏗 Архитектура и Технологии

| Слой           | Инструменты                                                                        |
|----------------|------------------------------------------------------------------------------------|
| **Frontend**   | **React 19**, TypeScript, Vite                                                         |
| **Styling**    | **Tailwind CSS**, кастомная дизайн-система с эффектами Glassmorphism и Neon Shadows  |
| **State**      | **React Context** (ScrollContext + ToastContext) с localStorage persistence    |
| **Backend**    | **Vercel Serverless Functions** (Node.js) + **Edge Runtime** (SSE streaming для ассистента) |
| **Database**   | **Upstash Redis** (высокопроизводительный Rate Limiting и база для Радара)         |
| **AI Движок**  | **Google Gemini API** (Gemini 3.1 Flash Lite, Gemini 3 Flash, Gemini 2.5 Flash, Gemma 4 31B-IT) + Vision + RAG + Search Grounding |
| **PWA**        | Полная поддержка Offline-режима и установки на рабочий стол через `vite-plugin-pwa` |
| **Linter**     | **ESLint 9** (Flat Config) + **Prettier**                                          |
| **Тесты**      | **Vitest** + React Testing Library (338 тестов, 42 файла) + **Playwright** E2E  |

> **Инженерные особенности:**
> -   **Strongly Typed**: Весь проект написан на строгом TypeScript (`strict`, `noUncheckedIndexedAccess`) с использованием **Zod** для валидации контрактов API.
> -   **Generic Logic**: Универсальный хук `useClaimForm<T>` обеспечивает переиспользование логики между разными типами претензий.
> -   **Resilience**: Механизмы `AbortController` для отмены запросов и автоматические ретраи (`fetchWithRetry`) с защитным парсингом JSON для стабильности AI-генерации.
> -   **DRY Backend**: Централизованные модули `api/_shared/` (ratelimit, turnstile, telegram, errors) устраняют дублирование кода между всеми API-хендлерами.
> -   **CI/CD**: Автоматическая проверка стиля (Lint), типов (tsc), 338 тестов, coverage thresholds (70%) и production-сборка на каждый PR через GitHub Actions.

---

## 🛡 Безопасность и надежность

Мы уделяем огромное внимание защите серверных мощностей и данных:
- **Telegram Webhook Authentication**: Верификация входящих запросов через `X-Telegram-Bot-Api-Secret-Token`.
- **IP-хэширование (HMAC-SHA-256)**: IP-адреса пользователей хэшируются с помощью HMAC с секретным ключом (`IP_HASH_SECRET`) перед передачей в любые системы мониторинга — защита от rainbow-table атак.
- **API-ключи в заголовках**: Все ключи (Gemini API) передаются через защищённые HTTP-заголовки, а не URL-параметры.
- **Cloudflare Turnstile**: Интегрированная невидимая капча для защиты API от ботов.
- **Serverless Rate Limiting**: Жёсткие лимиты на базе Redis со стратегией **fail-closed** (при сбое Redis запрос отклоняется).
- **Input Sanitization**: Многоуровневая очистка ввода — **Zod** (schema validation) + `sanitizeForPrompt` (prompt injection) + `sanitizeForStorage` (XSS) + `escapeHtml` (Telegram HTML).
- **Strict CSP & Security Headers**: `Content-Security-Policy` (с `worker-src`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `Referrer-Policy` — настроены в `vercel.json`.
- **Defensive API**: Защищённый парсинг `res.json().catch()` во всех сетевых сервисах, предотвращающий падения при нестабильном ответе сервера.
- **Graceful Degradation**: Тщательно проработанные Error Boundaries и fallback-интерфейсы.
- **Structured JSON Logging**: Все серверные логи в формате JSON с фильтрацией stack traces в production.

> Подробнее: [SECURITY.md](.github/SECURITY.md) | [Политика конфиденциальности](https://chestnayapodpiska.vercel.app/privacy)

---

## 📈 SEO и Поисковая оптимизация

- **Structured Data**: Интеграция JSON-LD (`WebApplication`, `FAQPage`, `ItemList`) на всех ключевых страницах для Rich Snippets в Google и Яндекс.
- **Meta Tags**: Полная поддержка OpenGraph, Twitter Cards и канонических URL через `react-helmet-async`.
- **Performance**: 95+ Score в Lighthouse за счет минимизации JS-бандла и оптимизации шрифтов.

## ⚡ Производительность

Архитектура оптимизирована по стандартам 2026 года:
- **Lazy Loading**: Тяжёлые зависимости (`docx` 407 KB, `react-markdown` 157 KB, Vercel Analytics) загружаются **только по требованию** через `React.lazy` и dynamic `import()`.
- **Redis Auto-Pipelining**: Все 8 Redis-инстансов используют `enableAutoPipelining` для батчинга конкурентных HTTP-запросов к Upstash.
- **Speculation Rules API**: Браузер предзагружает (`prerender`) основные страницы при наведении курсора (`eagerness: "moderate"`).
- **PWA Workbox Strategies**: `CacheFirst` для статики, `NetworkFirst` с 3s timeout для API, `StaleWhileRevalidate` для шрифтов.
- **React 19 Compiler**: Автоматическая мемоизация компонентов через `babel-plugin-react-compiler`.
- **Bundle Analysis**: Интегрирован `rollup-plugin-visualizer` для data-driven оптимизации (`dist/stats.html`).

## ♿ Доступность (Accessibility)

- Семантическая разметка: `<nav>`, `role="main"`, `aria-current="page"`, `role="dialog"`, `aria-modal`.
- `aria-label` на всех интерактивных элементах навигации, поиска и чата.
- Focus trap в модальных окнах (LegalBot) с корректной клавиатурной навигацией.
- Skip-to-content ссылка (`Перейти к содержимому`) для клавиатурной навигации.
- `prefers-reduced-motion` – глобальное отключение анимаций для пользователей с вестибулярными расстройствами.

---

## 🚀 Быстрый старт (Локально)

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/tigralint/chestnayapodpiska.git
   cd chestnayapodpiska
   npm install
   ```

2. **Настройте переменные окружения:**
   Создайте файл `.env` в корне (см. `.env.example`):
   ```env
   GEMINI_API_KEY=...
   VITE_TURNSTILE_SITE_KEY=...
   TURNSTILE_SECRET_KEY=...
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_ADMIN_CHAT_ID=...
   TELEGRAM_WEBHOOK_SECRET=...
   IP_HASH_SECRET=...          # 32-byte hex string for HMAC IP hashing
   ```

3. **Запустите проект:**
   ```bash
   npm run dev        # Локальный сервер фронтенда
   npx vercel dev     # Локальная эмуляция серверных функций (рекомендуется)
   ```

4. **Тестирование:**
   ```bash
   npm test           # Запуск Vitest (338 unit-тестов)
   npm run coverage   # Тесты + coverage report с порогами (70%)
   npm run test:e2e   # Playwright E2E smoke-тесты
   ```

---

## 🤝 Участие в проекте (Contributing)

Мы приветствуем Pull Requests! Пожалуйста, ознакомьтесь с [CONTRIBUTING.md](./.github/CONTRIBUTING.md) перед началом работы.  
*Важно: созданием PR вы подтверждаете согласие с передачей прав в рамках модели двойного лицензирования.*

---

## ⚖️ Лицензия

Проект распространяется по модели **Двойного лицензирования (Dual License)**:

1. **Некоммерческое использование**: Лицензия [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) (свободно для личных и образовательных целей).
2. **Коммерческое использование**: Использование в любых приносящих прибыль продуктах или сервисах требует приобретения лицензии у автора.

Подробный текст и юридические ограничения см. в файле [LICENSE](LICENSE).

---

## 📞 Контакты

Автор и ведущий разработчик: **Тигран Мкртчян**

<p align="left">
  <a href="https://t.me/tigralint"><img src="https://img.shields.io/badge/Telegram-@tigralint-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram" /></a>
  <a href="https://vk.com/fairsubs"><img src="https://img.shields.io/badge/ВКонтакте-vk.com%2Ffairsubs-0077FF?style=for-the-badge&logo=vk&logoColor=white" alt="VK" /></a>
</p>

---
<div align="center">
  <i>Спасибо, что делаете цифровой мир честнее.</i>
</div>
