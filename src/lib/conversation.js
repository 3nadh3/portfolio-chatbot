// Keep complete recent turns within a predictable context budget.
const MAX_MESSAGES = 24;
const MAX_CHARS = 24000;
function invalid(message) { const error = new Error(message); error.status = 400; throw error; }
function parseConversation(body = {}) {
  if (!body || typeof body.input !== 'string' || !body.input.trim() || body.input.length > 2000) {
    invalid('input must contain between 1 and 2000 characters');
  }
  const raw = body.history === undefined ? [] : body.history;
  if (!Array.isArray(raw) || raw.length > 200) invalid('history must be an array of at most 200 messages');
  const messages = raw.map((message, index) => {
    if (!message || typeof message !== 'object') invalid('Invalid history message');
    // Accept the old model/text format as well as the frontend assistant/content format.
    const role = message.role === 'assistant' ? 'model' : message.role;
    const text = message.content === undefined ? message.text : message.content;
    if (role !== (index % 2 === 0 ? 'user' : 'model') || typeof text !== 'string' || !text.trim() || text.length > 12000) {
      invalid('history must contain alternating user and assistant messages with valid text');
    }
    return { role, parts: [{ text: text.trim() }] };
  });
  if (messages.length % 2 !== 0) invalid('history must contain completed conversation turns');
  let history = messages.slice(-MAX_MESSAGES);
  let chars = history.reduce((total, message) => total + message.parts[0].text.length, 0);
  while (chars > MAX_CHARS && history.length) {
    chars -= history[0].parts[0].text.length + history[1].parts[0].text.length;
    history = history.slice(2);
  }
  return { input: body.input.trim(), history };
}
module.exports = { parseConversation };
