// Read only safe quota fields; never return an upstream URL, prompt, or key.
function quotaDiagnostics(error) {
  const details=Array.isArray(error.errorDetails)?error.errorDetails:[];
  const messageLimits=[];
  const pattern=/Quota exceeded for metric:\s*([a-z0-9._/]+),\s*limit:\s*(\d+)/gi;
  for(const match of String(error.message||'').matchAll(pattern)) {
    messageLimits.push({metric:match[1],limit:Number(match[2])});
  }
  const limits=[];
  let daily=false,minute=false,unavailable=false,retryAfterSeconds;
  for(const detail of details) {
    if(detail?.['@type']==='type.googleapis.com/google.rpc.QuotaFailure') {
      for(const violation of Array.isArray(detail.violations)?detail.violations:[]) {
        const id=String(violation.quotaId||'')+' '+String(violation.quotaMetric||'');
        const perDay=/PerDay|per_day|daily/i.test(id);
        const perMinute=/PerMinute|per_minute/i.test(id);
        daily ||= perDay;
        minute ||= perMinute;
        const reported=violation.quotaValue ?? messageLimits.find(item=>item.metric===violation.quotaMetric)?.limit;
        const limit=reported===undefined?undefined:Number(reported);
        if(Number.isFinite(limit)&&limit>=0) {
          unavailable ||= limit===0;
          const dimension=/token/i.test(id)?(perDay?'tokensPerDay':perMinute?'tokensPerMinute':'tokens'):perDay?'requestsPerDay':perMinute?'requestsPerMinute':'requests';
          if(!limits.some(item=>item.dimension===dimension&&item.limit===limit))limits.push({dimension,limit});
        }
      }
    }
    if(detail?.['@type']==='type.googleapis.com/google.rpc.RetryInfo') {
      const seconds=/^(\d+(?:\.\d+)?)s$/.exec(String(detail.retryDelay||''));
      if(seconds&&Number(seconds[1])<=86400)retryAfterSeconds=Math.max(1,Math.ceil(Number(seconds[1])));
    }
  }
  return {scope:daily?'daily':minute?'minute':'unknown',...(limits.length?{limits}:{}),...(!daily&&!unavailable&&retryAfterSeconds?{retryAfterSeconds}:{}),unavailable};
}

function providerError(error) {
  const modelCodes=['MODEL_RESPONSE_TRUNCATED','MODEL_RESPONSE_INVALID','MODEL_RESPONSE_EMPTY'];
  if(modelCodes.includes(error.code))return {status:502,code:error.code};
  if(error instanceof SyntaxError)return {status:502,code:'MODEL_RESPONSE_INVALID'};
  if(error.status!==429)return {status:502,code:'PROVIDER_UNAVAILABLE'};
  const {unavailable,...quota}=quotaDiagnostics(error);
  return {status:429,code:unavailable?'PROVIDER_QUOTA_UNAVAILABLE':quota.scope==='daily'?'PROVIDER_DAILY_QUOTA_EXHAUSTED':'PROVIDER_RATE_LIMITED',quota};
}
module.exports={providerError,quotaDiagnostics};
