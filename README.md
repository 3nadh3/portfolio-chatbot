# Trinadh portfolio chatbot

Node.js / Express backend for [trinadh.dev](https://trinadh.dev). Gemini receives resume-based system instructions and the visitor's real recent conversation, with no canned sample dialogue or shared conversation state.

## Chat API

`POST /chat`:

```json
{
  "input": "Which of those projects has a live demo?",
  "history": [
    { "role": "user", "content": "Tell me about CyberGuard" },
    { "role": "assistant", "content": "CyberGuard XAI detects phishing with explainable AI." }
  ]
}
```

Successful response: `{ "message": "Markdown answer", "suggestions": ["Contextual follow-up question?"], "model": "gemini-2.5-flash" }`. Gemini generates the answer and suggestions in one structured JSON response using the current question, validated conversation history, and server system instructions. Suggestions are never a fixed list and must follow the same guardrails; private requests produce no suggestions. Existing input-only clients remain supported. Legacy `model`/`text` history entries remain accepted. History must alternate user/assistant messages and contain completed exchanges; the current input is supplied separately exactly once. Invalid input returns HTTP 400. Other provider failures return HTTP 502; actual provider quota errors return HTTP 429. Errors never enter model context.

The model stays **gemini-2.5-flash**; there is no automatic model switch or fallback. Safe error metadata identifies the active model and, when Google supplies it, quota scope, numerical limits, and retry delay. `PROVIDER_DAILY_QUOTA_EXHAUSTED` distinguishes a daily allowance from `PROVIDER_RATE_LIMITED`. A reported zero quota becomes `PROVIDER_QUOTA_UNAVAILABLE`. A daily/zero quota never promises a minute-long recovery. Unknown 429s remain unknown rather than inventing RPM. Raw provider URLs, prompts, API keys, and project identifiers are excluded. Transient retry delays are also returned in `Retry-After`.

Check the deployed project's exact RPM/TPM/RPD in [Google AI Studio rate limits](https://aistudio.google.com/rate-limit). Google applies limits per project, and daily limits reset at midnight Pacific time. Different API keys in the same project do not create independent allowances. See [Google's rate-limit documentation](https://ai.google.dev/gemini-api/docs/rate-limits).

The backend retains at most 12 recent complete turns and 24,000 history characters. System instructions are defined on the server, never accepted as a history role. The frontend keeps successful turns in tab-scoped session storage and includes them with each request. New chat clears that context. API keys stay on the server.

## Run

Install dependencies with `npm ci`, configure the existing `GEMINI_API_KEY` and database environment variables, and run `npm start`. The deployed application lives on the `master` branch; `main` contains only the initial repository skeleton.

## Verify

```sh
node --test test/*.test.js
```

Tests cover the single-message contract, Gemini role mapping, malformed history rejection, bounded complete turns, and actual controller calls using an isolated mock model. They do not require a live API key.
