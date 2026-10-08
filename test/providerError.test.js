const {test}=require('node:test');
const assert=require('node:assert/strict');
const {providerError}=require('../src/lib/providerError');
function quotaError(quotaId,quotaValue,retryDelay='12.2s') {
  return {status:429,errorDetails:[{'@type':'type.googleapis.com/google.rpc.QuotaFailure',violations:[{quotaId,quotaMetric:'generate_content_requests',...(quotaValue===undefined?{}:{quotaValue})}]},{'@type':'type.googleapis.com/google.rpc.RetryInfo',retryDelay}]};
}
test('minute quota has the reported limit and rounded retry delay',()=>{
  assert.deepEqual(providerError(quotaError('GenerateRequestsPerMinutePerProject','10')),{status:429,code:'PROVIDER_RATE_LIMITED',quota:{scope:'minute',limits:[{dimension:'requestsPerMinute',limit:10}],retryAfterSeconds:13}});
});
test('daily quota is not represented as a short retry',()=>{
  assert.deepEqual(providerError(quotaError('GenerateRequestsPerDayPerProject','20')),{status:429,code:'PROVIDER_DAILY_QUOTA_EXHAUSTED',quota:{scope:'daily',limits:[{dimension:'requestsPerDay',limit:20}]}});
});
test('zero quota is unavailable rather than an ordinary cooldown',()=>{
  const failure=providerError(quotaError('GenerateRequestsPerMinutePerProject','0'));
  assert.equal(failure.code,'PROVIDER_QUOTA_UNAVAILABLE');
  assert.equal(failure.quota.retryAfterSeconds,undefined);
});
test('TPM and mixed daily/minute quotas keep their distinct dimensions',()=>{
  const error=quotaError('GenerateTokensPerMinutePerProject','250000');
  error.errorDetails[0].violations.push({quotaId:'GenerateRequestsPerDayPerProject',quotaValue:'20'});
  const failure=providerError(error);
  assert.equal(failure.code,'PROVIDER_DAILY_QUOTA_EXHAUSTED');
  assert.deepEqual(failure.quota.limits,[{dimension:'tokensPerMinute',limit:250000},{dimension:'requestsPerDay',limit:20}]);
});
test('message-only values are sanitized without copying private provider content',()=>{
  const error=quotaError('GenerateRequestsPerDayPerProject',undefined);
  error.message='URL with private-key and prompt. Quota exceeded for metric: generate_content_requests, limit: 20, model: gemini-2.5-flash';
  error.errorDetails[0].violations[0].quotaDimensions={project:'private-project-id'};
  const failure=providerError(error);
  assert.equal(failure.quota.limits[0].limit,20);
  assert.doesNotMatch(JSON.stringify(failure),/private/);
});
test('unknown 429s do not invent RPM; other failures are not rate limits',()=>{
  assert.deepEqual(providerError({status:429}),{status:429,code:'PROVIDER_RATE_LIMITED',quota:{scope:'unknown'}});
  assert.equal(providerError({status:503}).code,'PROVIDER_UNAVAILABLE');
  assert.equal(providerError(new SyntaxError()).code,'MODEL_RESPONSE_INVALID');
  assert.equal(providerError({code:'MODEL_RESPONSE_TRUNCATED'}).code,'MODEL_RESPONSE_TRUNCATED');
});
