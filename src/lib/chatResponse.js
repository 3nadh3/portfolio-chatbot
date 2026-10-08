// Gemini produces both the answer and contextual follow-ups in one generation.
const responseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', description: 'The answer to the latest question, in readable Markdown.' },
    suggestions: {
      type: 'array', items: { type: 'string' },
      description: 'Up to three short questions the visitor could ask next, grounded in this conversation. Empty for private or inappropriate requests.'
    }
  },
  required: ['message', 'suggestions']
};
function parseReply(text) {
  const data = JSON.parse(text);
  if (!data || typeof data.message !== 'string' || !data.message.trim() || data.message.length > 12000 || !Array.isArray(data.suggestions)) {
    const error = new Error('Invalid model reply');
    error.code = 'MODEL_RESPONSE_INVALID';
    throw error;
  }
  const suggestions = [...new Set(data.suggestions.filter(q => typeof q === 'string' && q.trim() && q.trim().length <= 120).map(q => q.trim()))].slice(0, 3);
  return { message: data.message.trim(), suggestions };
}
module.exports = { responseSchema, parseReply };
