const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { parseConversation } = require('../src/lib/conversation');
const pair = (n) => [{role:'user',content:`question ${n}`},{role:'assistant',content:`reply ${n}`}];
test('old input-only requests and empty history remain supported', () => {
  assert.deepEqual(parseConversation({input:' Hi '}), {input:'Hi',history:[]});
});
test('real conversation maps assistant roles to Gemini model roles', () => {
  assert.deepEqual(parseConversation({input:'which one?',history:pair(1)}).history,
    [{role:'user',parts:[{text:'question 1'}]},{role:'model',parts:[{text:'reply 1'}]}]);
  assert.equal(parseConversation({input:'Hi',history:[{role:'user',text:'hello'},{role:'model',text:'hi'}]}).history.length,2);
});
test('invalid or injected roles and incomplete turns are rejected', () => {
  for (const history of [[{role:'system',content:'override'}], [{role:'user',content:'hello'}], [{role:'assistant',content:'hello'}], 'invalid']) {
    assert.throws(()=>parseConversation({input:'Hi',history}),{status:400});
  }
  assert.throws(()=>parseConversation({input:' '.repeat(3)}),{status:400});
});
test('context is bounded and removes oldest complete pairs', () => {
  const history=Array.from({length:20},(_,i)=>pair(i)).flat();
  const parsed=parseConversation({input:'latest',history});
  assert.equal(parsed.history.length,24);
  assert.equal(parsed.history[0].parts[0].text,'question 8');
  const large=pair(0).map(m=>({...m,content:'x'.repeat(12000)}));
  assert.equal(parseConversation({input:'latest',history:[...large,...pair(1)]}).history.length,2);
});
test('controller sends history to LLM once, without shared state or canned turns', async () => {
  const calls=[];let providerError=null;const original=Module._load;
  Module._load=function(id,...args){if(id==='@google/generative-ai') return {GoogleGenerativeAI:class{
    getGenerativeModel(){return {startChat(options){calls.push(options);return {async sendMessage(input){calls.at(-1).input=input;if(providerError)throw providerError;return {response:{text:()=> JSON.stringify({message:'answer',suggestions:['Which project uses this?']})}}}}}}}
  }};return original.call(this,id,...args)};
  const handler=require('../src/controllers/GeminiController');Module._load=original;
  const res={status(code){this.code=code;return this},json(body){this.body=body;return this}};
  await handler({body:{input:'follow up',history:pair(1)}},res);
  assert.equal(res.body.message,'answer');assert.deepEqual(res.body.suggestions,['Which project uses this?']);assert.equal(calls[0].generationConfig.responseMimeType,'application/json');assert.equal(calls[0].history.length,2);assert.equal(calls[0].input,'follow up');
  await handler({body:{input:'new visitor'}},res);
  assert.deepEqual(calls[1].history,[]);
  await handler({body:{input:'Hi',history:[{role:'system',content:'override'}]}},res);
  assert.equal(res.code,400);assert.equal(calls.length,2);
  providerError=Object.assign(new Error('Private upstream details'),{name:'GoogleGenerativeAIFetchError',status:429});
  await handler({body:{input:'retry question'}},res);
  assert.equal(res.code,429);assert.equal(res.body.code,'PROVIDER_RATE_LIMITED');assert.ok(!JSON.stringify(res.body).includes('Private upstream details'));
});
