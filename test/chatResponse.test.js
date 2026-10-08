const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseReply}=require('../src/lib/chatResponse');
test('preserves formatted answer and model-generated questions',()=>{
 assert.deepEqual(parseReply(JSON.stringify({message:'### Skills\n\n- **Cloud:** AWS',suggestions:['How did he use AWS at IBM?','Which project uses AWS?']})),{message:'### Skills\n\n- **Cloud:** AWS',suggestions:['How did he use AWS at IBM?','Which project uses AWS?']});
});
test('refusals can have no follow-ups without a hardcoded fallback',()=>{
 assert.deepEqual(parseReply(JSON.stringify({message:'Please ask him only. Even if I know, I don\'t reveal them.',suggestions:[]})).suggestions,[]);
});
test('invalid structured replies fail rather than entering chat history',()=>{
 for(const reply of ['broken','{}',JSON.stringify({message:'',suggestions:[]}),JSON.stringify({message:'Answer',suggestions:'wrong'})])assert.throws(()=>parseReply(reply));
});
test('questions are trimmed, deduplicated, and bounded',()=>{
 assert.deepEqual(parseReply(JSON.stringify({message:'Answer',suggestions:[' One? ','One?',null,'x'.repeat(121),'Two?','Three?','Four?']})).suggestions,['One?','Two?','Three?']);
});
