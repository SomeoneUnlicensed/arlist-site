# Интеграция AI Agent (Вспышка) с Arlist Platform

## Архитектура

```
CLI Agent (Вспышка) ──→ POST /api/v1/chat/completions ──→ Arlist Platform ──→ DeepSeek / GigaChat
                              Authorization: Bearer <arlist_api_key>          (наши собственные, оплаченные ключи)
```

Никакой ротации прокси и стороннего анонимного free-tier — весь трафик идёт под нашими собственными провайдерскими ключами. Клиент обращается только к Arlist API; какой именно провайдер отвечает — деталь реализации, но не секрет и не подмена.

---

## 1. Device Code Auth Flow

### Step 1: Запрос device_code
```
POST /api/cli/auth/start
→ { deviceCode, userCode, verificationUri, expiresIn }
```

### Step 2: Покажи пользователю ссылку
```
→ Открой в браузере: https://arlist.ru/cli/auth?code=XXXX-XXXX
   или используй verificationUri
```

### Step 3: Polling (каждые 2-3 секунды)
```
POST /api/cli/auth/poll
Body: { deviceCode }

Response (pending):
  { status: 'pending' }

Response (confirmed):
  {
    status: 'confirmed',
    apiKey: 'arlist_sk_...',
    tariff: {
      type: 'FREE',
      name: 'Бесплатный',
      requestsPer5h: 30,
      requestsPerWeek: 200
    }
  }

Response (expired):
  { status: 'expired' }
```

### Step 4: Сохрани apiKey в конфиг CLI (~/.arlist/config.json)

---

## 2. Использование API (после авторизации)

### Chat Completions
```
POST /api/v1/chat/completions
Authorization: Bearer <arlist_api_key>
Content-Type: application/json

{
  "model": "deepseek-chat",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "напиши код" }
  ]
}
```

Формат тела запроса и ответа — стандартный OpenAI-compatible Chat Completions.
Стриминг (`stream: true`) пока не проксируется — ответ всегда приходит целиком.
Это известное ограничение первой версии, не тянули ради упрощения.

### Список доступных моделей
```
GET /api/v1/models
Authorization: Bearer <arlist_api_key>
→ { models: ["deepseek-chat", "gigachat"] }
```

Модели зависят от тарифа пользователя. Логические имена моделей маппятся на реальных
провайдеров в `src/controllers/llmProxy.controller.ts` (`MODEL_MAP`):

| Логическое имя | Провайдер | Модель у провайдера |
|---|---|---|
| `deepseek-chat` | DeepSeek | `deepseek-chat` |
| `deepseek-reasoner` | DeepSeek | `deepseek-reasoner` |
| `deepseek-v4-flash` | DeepSeek | `deepseek-v4-flash` (уточнить точное имя у провайдера) |
| `gigachat` | GigaChat | `GigaChat` |
| `gigachat-pro` | GigaChat | `GigaChat-Pro` |
| `gigachat-max` | GigaChat | `GigaChat-Max` (уточнить точное имя у провайдера) |

---

## 3. Ответы с ошибками

### 401 — неверный или отозванный API ключ
```json
{ "error": "Invalid or revoked API key" }
```

### 403 — модель недоступна на тарифе
```json
{
  "error": "Model not available on your tariff",
  "availableModels": ["deepseek-chat", "gigachat"]
}
```

### 429 — лимит тарифа исчерпан и оверран недоступен
```json
{
  "error": "Rate limit exceeded",
  "usagePercent": { "per5h": 100, "week": 60 },
  "remaining": { "per5h": 0, "perWeek": 80 },
  "balanceKopecks": 0,
  "overrunPriceKopecks": 0
}
```

Если у тарифа включён оверран (`overrunEnabled`) и на кошельке пользователя
(`balanceKopecks`) хватает средств на `overrunPriceKopecks`, запрос **не блокируется**:
он выполняется, а стоимость списывается с баланса. 429 приходит только когда лимит
исчерпан **и** оверран невозможен (выключен или не хватает денег).

Заголовки ответа на каждый запрос:
- `X-RateLimit-Used-Percent-5h` / `-Week` — сколько % от лимита тарифа израсходовано
- `X-Wallet-Balance-Kopecks` — текущий баланс кошелька

### 504 — таймаут апстрима
```json
{ "error": "Upstream timeout" }
```

---

## 4. Тарифы

Пока активен только один — **FREE**, за наш счёт. BASIC/PRO появятся позже,
когда будет понятна реальная стоимость DeepSeek/GigaChat на живом трафике.

| Параметр | FREE |
|----------|------|
| Модели | DeepSeek Chat, GigaChat |
| Запросов/5 часов | 30 |
| Запросов/неделя | 200 |
| Оверран | выключен |

Лимиты — стартовая точка, не финальные цифры; корректируются по факту реальных
расходов на DeepSeek/GigaChat.

---

## 5. Оверран и кошелёк

- `User.balanceKopecks` — баланс кошелька в копейках, пополняется вручную (UI пополнения
  ещё не сделан, поле уже в схеме).
- `Tariff.overrunEnabled` + `Tariff.overrunPriceKopecks` — включает платный овердрафт: когда
  5-часовой или недельный лимит исчерпан, но включён оверран и на кошельке хватает денег,
  запрос выполняется, а `overrunPriceKopecks` списывается с баланса вместо блокировки 429.
- Каждая запись `UsageRecord` хранит `isOverrun` и `costKopecks` — можно посчитать, сколько
  реально было потрачено сверх бесплатного лимита.
- Для FREE-тарифа оверран сейчас выключен — это осознанно, бесплатный тариф не должен уметь
  тратить чужие деньги без включённого оверрана.

---

## 6. Пример реализации CLI (псевдокод)

```
function startAuth():
    response = POST /api/cli/auth/start
    deviceCode = response.deviceCode
    verificationUri = response.verificationUri

    print("Открой в браузере: " + verificationUri)
    print("Жду подтверждения...")

    while true:
        sleep(2)
        result = POST /api/cli/auth/poll { deviceCode }

        if result.status == "confirmed":
            save_config(apiKey: result.apiKey, tariff: result.tariff)
            print("Авторизация успешна")
            break
        elif result.status == "expired":
            print("Код истёк, запусти заново")
            break

function chatCompletions(model, messages):
    apiKey = load_config().apiKey

    if not apiKey:
        startAuth()
        apiKey = load_config().apiKey

    response = POST /api/v1/chat/completions
        Authorization: Bearer apiKey
        Body: { model, messages }

    if response.status == 401:
        startAuth()  // ключ протух, переавторизация
        retry()
    elif response.status == 429:
        print("Лимит исчерпан: " + response.usagePercent.per5h + "% 5-часового лимита")
        wait(until limit resets)
        retry()

    return response
```

---

## 7. Использование на стороне CLI

Рекомендуется кэшировать usage stats, чтобы не дёргать API без необходимости:

```
GET /api/cli/auth/usage
Authorization: Bearer <arlist_api_key>
→ {
    usagePercent: { per5h: 13, week: 40 },
    remaining: { per5h: 13, perWeek: 120 },
    wallet: { balanceKopecks: 0, overrunEnabled: false, overrunPriceKopecks: 0 },
    tokens: { prompt: 12345, output: 6789 },
    tariff: { type: "FREE", name: "Бесплатный" }
}
```

---

## 8. Деплой

1. Установи зависимости: `npm install`
2. Собери React: `cd react-app && npm install && npm run build`
3. Прогони миграцию: `npx prisma migrate dev --name init`
4. Засей тарифы: `npx tsx prisma/seed.ts`
5. Укажи в `.env`: `DEEPSEEK_API_KEY`, `GIGACHAT_AUTH_KEY`, `GIGACHAT_SCOPE`
6. Запусти: `npm run dev` или `npm start`

### Известный нюанс GigaChat

TLS-цепочка `gigachat.devices.sberbank.ru` подписана корневым сертификатом
НУЦ Минцифры, которого нет в доверенном хранилище Node по умолчанию. В проде нужно
поставить этот корневой сертификат и передать его через `NODE_EXTRA_CA_CERTS` или
кастомный `https.Agent` — **не** отключать проверку сертификата (`rejectUnauthorized: false`)
в качестве обхода.
