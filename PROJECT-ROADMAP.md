# SGR SDK Implementation Roadmap

## Фаза 1: Подготовка инфраструктуры (30 мин)

**Цель:** Настроить окружение для разработки и тестирования

### 1.1 Установка зависимостей
- [x] ~~Добавить `vitest` в `packages/core/package.json` (devDependencies)~~ (2025-11-15 — добавлено в devDependencies)
- [x] ~~Добавить `vitest` в `packages/adapters/package.json` (devDependencies)~~ (2025-11-15 — добавлено в devDependencies)
- [x] ~~Установить `openai` (официальный SDK)~~ (2025-11-15 — зависимость добавлена в `packages/adapters`)
- [x] ~~Установить `@google/genai` для Gemini adapter~~ (2025-11-15 — использован опубликованный пакет `@google/generative-ai`)
- [x] ~~Установить `zod-to-json-schema` для конвертации схем~~ (2025-11-15 — зависимость добавлена в `packages/adapters`)
- [ ] Запустить `bun install` в корне проекта *(заблокировано: npm registry возвращает 403 — требуется повторить при доступе)*

### 1.2 Настройка тестирования
- [x] ~~Создать `packages/core/vitest.config.ts`~~ (2025-11-15 — базовая конфигурация на Vitest)
- [x] ~~Создать `packages/adapters/vitest.config.ts`~~ (2025-11-15 — базовая конфигурация на Vitest)
- [x] ~~Добавить задачу `test` в `turbo.json` с конфигурацией outputs~~ (2025-11-15 — добавлена общая задача `test` c `coverage/**` outputs)
- [ ] Проверить работу тестов командой `bun x turbo run test` *(заблокировано той же 403 ошибкой npm registry)*

---

## Фаза 2: Завершение @sgr/core (2–3 часа)

**Цель:** Реализовать полный SGR loop и покрыть тестами

### 2.1 Реализация SGRAgent методов
- [ ] **`invoke(input: string)`** в `packages/core/src/agent.ts`
  - Принимает user input, создает начальное сообщение
  - Итерирует до `maxSteps` (по умолчанию 10)
  - На каждом шаге вызывает `plan()` для получения следующего действия
  - Обрабатывает типы: `clarification`, `plan`, `tool_call`, `final_answer`
  - При `tool_call` вызывает `callTool()` и добавляет результат в контекст
  - При `final_answer` возвращает `{ final, events }`
  - Бросает ошибку при превышении `maxSteps`

- [ ] **`run(input: string): AsyncGenerator<SGREvent>`** в `packages/core/src/agent.ts`
  - Аналогично `invoke()`, но yield'ит каждый `SGREvent`
  - Позволяет стримить события в реальном времени
  - Финальный event имеет `kind: "final"`

- [ ] **Использование `systemPrompt`**
  - Добавить `systemPrompt` в начальный массив messages
  - Если не задан, использовать дефолтный промпт для SGR

- [ ] **Поддержка `maxSteps`**
  - Читать из `config.maxSteps ?? 10`
  - Прерывать loop при достижении лимита

### 2.2 Документация (JSDoc)
- [x] ~~Документировать все типы в `packages/core/src/interfaces.ts`~~ (ранее реализовано — см. актуальные JSDoc комментарии)
- [x] ~~Документировать `ToolDefinition`, `ToolRegistry` в `packages/core/src/tools.ts`~~ (ранее реализовано — доступно в коде)
- [x] ~~Документировать `DefaultNextStepSchema` в `packages/core/src/schema.ts`~~ (ранее реализовано — см. описание схемы)
- [x] ~~Документировать `SGREvent` типы в `packages/core/src/events.ts`~~ (ранее реализовано)
- [ ] Документировать `SGRAgent` класс и методы в `packages/core/src/agent.ts`

### 2.3 Тестирование
- [ ] **`packages/core/src/tools.test.ts`**
  - Тест `ToolRegistry.register()` и `get()`
  - Тест `list()` возвращает все инструменты
  - Тест парсинга аргументов через Zod schema

- [ ] **`packages/core/src/agent.test.ts`**
  - Mock `LLMClient` с предопределенными ответами
  - Тест успешного `invoke()` с `final_answer`
  - Тест `tool_call` → вызов инструмента → продолжение
  - Тест превышения `maxSteps`
  - Тест обработки невалидного schema output (Zod error)
  - Тест `run()` generator'а

- [ ] **`packages/core/src/schema.test.ts`**
  - Валидация всех типов `DefaultNextStepSchema`
  - Тест невалидных данных (должны бросать ZodError)

### 2.4 Чистка кода
- [ ] Убрать все `TODO:` комментарии
- [ ] Исправить `biome-ignore` suppressions (использовать top-level regex в `utils.ts`)
- [ ] Заменить `stepCounter++` на функциональный подход
- [ ] Убрать barrel file warning из `index.ts` (временно можно оставить ignore)

---

## Фаза 3: Переработка @sgr/adapters (2–3 часа)

**Цель:** Использовать официальные SDK вместо raw fetch

### 3.1 OpenAI adapter (Vercel AI SDK)
- [ ] Переписать `packages/adapters/src/openai.ts` на `generateObject` из `ai`
  - Импортировать `{ openai }` и `{ generateObject }` из `ai`
  - Передавать Zod schema напрямую
  - Убрать ручной парсинг JSON
  - Обработать ошибки SDK

- [ ] Обновить `OpenAIAdapterOptions` под новый подход
  - Оставить `apiKey`, `model`, `baseUrl`
  - Убрать `completionEndpoint` (не нужен с SDK)

### 3.2 Gemini adapter (Official SDK)
- [ ] Переписать `packages/adapters/src/gemini.ts` на `@google/generative-ai`
  - Использовать `GoogleGenerativeAI` класс
  - Настроить `responseSchema` с JSON Schema
  - Убрать deprecated `:generateText` endpoint

- [ ] Создать `zodToJsonSchema()` в `packages/adapters/src/utils.ts`
  - Обертка над `zod-to-json-schema`
  - Конвертировать Zod → JSON Schema для Gemini

### 3.3 Чистка utils
- [ ] Удалить `parseStructuredResponse()` (больше не нужен)
- [ ] Оставить только `zodToJsonSchema()` в `utils.ts`
- [ ] Исправить barrel file exports в `index.ts`

### 3.4 Документация
- [ ] JSDoc для `createOpenAILLMClient` с примерами
- [ ] JSDoc для `createGeminiLLMClient` с примерами
- [ ] JSDoc для утилит

### 3.5 Тестирование
- [ ] **`packages/adapters/src/openai.test.ts`**
  - Mock `generateObject` из Vercel AI SDK
  - Тест успешной генерации структурированного output
  - Тест обработки ошибок API
  - Тест переопределения модели

- [ ] **`packages/adapters/src/gemini.test.ts`**
  - Mock Google Generative AI
  - Тест конвертации Zod → JSON Schema
  - Тест structured output
  - Тест обработки ошибок

### 3.6 Чистка
- [ ] Убрать все TODO и biome-ignore комментарии
- [ ] Запустить `bun x ultracite fix`

---

## Фаза 4: Демо-приложение (3–4 часа)

**Цель:** Создать работающие примеры агентов для презентации

### 4.1 Структура проекта
- [ ] Создать `apps/demo/` директорию
- [ ] Создать `apps/demo/package.json` с зависимостями на `@sgr/core` и `@sgr/adapters`
- [ ] Создать `apps/demo/tsconfig.json` extending base config
- [ ] Добавить demo в workspace root `package.json`

### 4.2 Инструменты (Tools)
- [ ] **`apps/demo/src/tools/webSearch.ts`**
  - Mock web search (возвращает фейковые результаты)
  - Zod schema: `{ query: string }`
  - Output: массив `{ title, url, snippet }`

- [ ] **`apps/demo/src/tools/db.ts`**
  - In-memory key-value store
  - Zod schema: `{ operation: "read" | "write", key: string, value?: string }`
  - Методы: `read(key)`, `write(key, value)`

### 4.3 Агенты
- [ ] **`apps/demo/src/agents/marketing.ts`**
  - `MarketingAgent` на базе `SGRAgent`
  - Использует `webSearchTool`
  - System prompt: "You are a marketing strategist..."
  - Пример задачи: "Create a marketing campaign for eco-friendly water bottles"

- [ ] **`apps/demo/src/agents/research.ts`**
  - `ResearchAgent` на базе `SGRAgent`
  - Использует `webSearchTool` + `dbTool`
  - System prompt: "You are a research assistant..."
  - Пример задачи: "Research competitors in the AI coding tools market"

### 4.4 CLI
- [ ] **`apps/demo/src/main.ts`**
  - Парсинг аргументов: `--agent <marketing|research> --query "..."`
  - Выбор провайдера: `--provider <openai|gemini>`
  - Загрузка API ключей из env
  - Запуск `agent.run()` с стримингом событий
  - Pretty-print событий с цветами (используя `chalk` или аналог)

- [ ] **Логирование событий**
  - `model_step`: показать тип и содержимое решения
  - `tool_call`: показать имя инструмента и аргументы
  - `tool_result`: показать результат
  - `log`: вывести сообщение
  - `final`: показать финальный ответ

### 4.5 Документация демо
- [ ] Создать `apps/demo/README.md` с примерами запуска
- [ ] Добавить `.env.example` с ключами API

---

## Фаза 5: Eval и бенчмарки (1–2 часа)

**Цель:** Сравнить baseline vs SGR

### 5.1 Структура
- [ ] Создать `apps/eval/` директорию
- [ ] Создать `apps/eval/package.json`
- [ ] Создать `apps/eval/tsconfig.json`

### 5.2 Задачи
- [ ] **`apps/eval/src/tasks.ts`**
  - 5–10 задач для marketing (campaign ideas, positioning)
  - 5–10 задач для research (competitor analysis, trend research)
  - Экспорт: `{ id, category, prompt, expectedStructure }`

### 5.3 Runners
- [ ] **`apps/eval/src/baseline.ts`**
  - Прямой вызов LLM без SGR
  - Один промпт с инструкциями "return JSON"
  - Попытка распарсить ответ

- [ ] **`apps/eval/src/sgr.ts`**
  - Запуск через `SGRAgent.invoke()`
  - Логирование событий

### 5.4 Метрики
- [ ] **`apps/eval/src/metrics.ts`**
  - `validOutputRate`: % задач с валидным JSON
  - `successRate`: % задач, которые дали нужный тип (subjective)
  - `avgSteps`: среднее число шагов в SGR
  - `avgTime`: среднее время выполнения

### 5.5 Main runner
- [ ] **`apps/eval/src/main.ts`**
  - Запуск всех задач через baseline и SGR
  - Сохранение результатов в `results/baseline.json` и `results/sgr.json`
  - Вывод сравнительной таблицы

---

## Фаза 6: Документация (2–3 часа)

**Цель:** Полное описание API и гайды

### 6.1 Package READMEs
- [ ] **`packages/core/README.md`**
  - Краткое описание SGR концепции
  - Установка и setup
  - API reference: `SGRAgent`, `ToolRegistry`, schemas
  - Примеры использования с кодом
  - Troubleshooting

- [ ] **`packages/adapters/README.md`**
  - Список поддерживаемых провайдеров
  - Setup OpenAI (API key, модели)
  - Setup Gemini (API key, модели)
  - Примеры создания клиентов
  - Кастомизация (custom base URL, fetch)

### 6.2 Root README
- [ ] **Обновить корневой `README.md`**
  - Заменить Turborepo boilerplate на SGR SDK
  - Добавить badges (build status, coverage, license)
  - Quick Start секция
  - Ссылки на package READMEs
  - Ссылки на demo и examples

### 6.3 Гайды
- [ ] **`docs/GETTING-STARTED.md`**
  - From zero to first agent (step-by-step)
  - Настройка environment
  - Первый SGRAgent с tool
  - Запуск и debugging

- [ ] **`docs/ARCHITECTURE.md`**
  - Диаграмма SGR loop
  - Объяснение patterns (cascade, routing, cycle)
  - Agent lifecycle
  - Event system
  - Extensibility points

- [ ] **`docs/API.md`**
  - Полный API reference
  - Все типы, интерфейсы, классы
  - Параметры и return types
  - Code examples для каждого API

### 6.4 Examples
- [ ] **`examples/simple-agent/`**
  - Минимальный пример агента
  - Один файл, без зависимостей кроме core/adapters

- [ ] **`examples/custom-schema/`**
  - Пример с кастомной next-step схемой

- [ ] **`examples/multi-tool/`**
  - Агент с несколькими инструментами

---

## Фаза 7: CI/CD и инфраструктура (1 час)

**Цель:** Автоматизация проверок и релизов

### 7.1 Turbo конфигурация
- [ ] Проверить `turbo.json` outputs для всех задач
- [ ] Убедиться в правильных `dependsOn` для `test` → `build`
- [ ] Добавить caching для test runs

### 7.2 GitHub Actions
- [ ] **`.github/workflows/ci.yml`**
  - Триггер: push, pull_request
  - Jobs: `build`, `test`, `lint`, `check-types`
  - Matrix strategy для Node.js версий
  - Upload coverage reports

- [ ] **`.github/workflows/release.yml`** (draft)
  - Триггер: tag push (`v*`)
  - Запуск тестов
  - Publish to npm (с secrets)
  - Create GitHub release

### 7.3 Development tools
- [ ] Проверить `lint-staged` конфигурацию
- [ ] Убедиться в работе git hooks
- [ ] Создать `.nvmrc` с версией Node.js

### 7.4 Contribution guidelines
- [ ] **`CONTRIBUTING.md`**
  - Code of conduct
  - Как отправить PR
  - Стандарты кода (Ultracite)
  - Тестирование requirements
  - Commit message format

---

## Фаза 8: Финализация (1 час)

**Цель:** Проверка качества и подготовка к релизу

### 8.1 Code quality
- [ ] Запустить `bun x ultracite fix` на всех файлах
- [ ] Убедиться, что нет TODO комментариев
- [ ] Проверить отсутствие `console.log` в production коде
- [ ] Проверить typing (нет `any` без необходимости)

### 8.2 Build & Test
- [ ] `bun x turbo run build` — проверить сборку всех пакетов
- [ ] `bun x turbo run test` — coverage > 70% для core и adapters
- [ ] `bun x turbo run lint` — zero warnings/errors
- [ ] `bun x turbo run check-types` — zero type errors

### 8.3 Package metadata
- [ ] Обновить `packages/core/package.json`
  - `keywords`: ["sgr", "ai", "llm", "agent", "reasoning"]
  - `repository`, `homepage`, `bugs`
  - `license`: MIT
  - `author`

- [ ] Обновить `packages/adapters/package.json` аналогично

### 8.4 Changelog
- [ ] **`CHANGELOG.md`**
  - Секция для v0.1.0
  - Список фич: SGR core, OpenAI/Gemini adapters, demo agents
  - Breaking changes (если есть)

---

## Фаза 9: Презентация (1–2 часа)

**Цель:** Подготовка демо и материалов для питча

### 9.1 Слайды
- [ ] **Проблема**: нестабильность LLM-агентов, broken output, непредсказуемость
- [ ] **Решение**: Schema-Guided Reasoning — structured thinking
- [ ] **Архитектура**: диаграмма core + adapters + agents
- [ ] **Demo**: live run агента с reasoning steps
- [ ] **Метрики**: таблица baseline vs SGR

### 9.2 Визуальные материалы
- [ ] Записать скринкаст `MarketingAgent` в действии
- [ ] Создать диаграмму SGR loop (Mermaid или draw.io)
- [ ] Скриншоты CLI output с цветным логированием
- [ ] Таблица сравнения из eval результатов

### 9.3 Live demo подготовка
- [ ] Протестировать demo на свежем окружении
- [ ] Подготовить 2–3 примера запросов
- [ ] Backup план (если API упадет)
- [ ] Скрипт презентации (что говорить и когда)

---

## Чек-лист готовности к релизу

### Критичные (Must Have)
- [ ] `@sgr/core` полностью реализован с `invoke()` и `run()`
- [ ] Тесты покрывают >70% кода
- [ ] OpenAI и Gemini адаптеры работают с официальными SDK
- [ ] Минимум 2 работающих demo агента
- [ ] README и GETTING-STARTED документация
- [ ] Build проходит без ошибок
- [ ] Все lint warnings исправлены

### Желательные (Should Have)
- [ ] Eval результаты показывают улучшение над baseline
- [ ] API documentation полная
- [ ] CI/CD настроен
- [ ] Examples готовы
- [ ] Презентационные материалы

### Опциональные (Nice to Have)
- [ ] Coverage >85%
- [ ] Next.js UI для демо
- [ ] Видео-туториалы
- [ ] Blog post про SGR
- [ ] npm packages опубликованы