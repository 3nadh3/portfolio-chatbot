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

Successful response: `{ "message": "..." }`. Existing input-only clients remain supported. Legacy `model`/`text` history entries remain accepted. History must alternate user/assistant messages and contain completed exchanges; the current input is supplied separately exactly once. Invalid input returns HTTP 400. Provider failures return HTTP 502 so clients can retry without adding an error to model context.

The backend retains at most 12 recent complete turns and 24,000 history characters. System instructions are defined on the server, never accepted as a history role. The frontend keeps successful turns in tab-scoped session storage and includes them with each request. New chat clears that context. API keys stay on the server.

## Run

Install dependencies with `npm ci`, configure the existing `GEMINI_API_KEY` and database environment variables, and run `npm start`. The deployed application lives on the `master` branch; `main` contains only the initial repository skeleton.

## Verify

```sh
node --test test/conversation.test.js
```

Tests cover the single-message contract, Gemini role mapping, malformed history rejection, bounded complete turns, and actual controller calls using an isolated mock model. They do not require a live API key.
