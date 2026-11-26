import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { createApp } from '../../apps/api/app.js';
import { config } from '../../apps/api/config.js';
import { identity, sanitizeContext } from '../../apps/api/visionfit.js';
async function fixture(t, extra={}) {
  const dir=mkdtempSync(join(tmpdir(),'vif-test-'));
  const c=config({ DB_PATH: join(dir,'test.sqlite'), ...extra });
  const {server}=createApp(c,{logger:()=>{}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  t.after(async()=>{await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});});
  const call=async(path,{cookie,method='GET',body,origin=c.origin}={})=>{
    const res=await fetch(base+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
    return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0],headers:res.headers};
  };
  const login=async(role='member')=>call('/api/auth/login',{method:'POST',body:{role,email:`${role}@demo.visionfit.local`,password:'Demo123!'}});
  return {call,login,base};
}
test('demo login, deterministic answer, persistent private history and delete',async t=>{
  const {call,login}=await fixture(t);
  assert.equal((await call('/api/messages')).status,401);
  const a=await login();assert.equal(a.status,200);assert.ok(a.headers.get('set-cookie').includes('HttpOnly'));
  const result=await call('/api/chat',{method:'POST',cookie:a.cookie,body:{message:'Gói tập còn bao nhiêu buổi?'}});
  assert.equal(result.status,200);assert.match(result.body.content,/12/);assert.match(result.body.content,/minh họa/);
  const b=await login('trainer');assert.deepEqual((await call('/api/messages',{cookie:b.cookie})).body.messages,[]);
  const again=await login();assert.equal((await call('/api/messages',{cookie:again.cookie})).body.messages.length,2);
  await call('/api/messages',{method:'DELETE',cookie:again.cookie});assert.equal((await call('/api/messages',{cookie:again.cookie})).body.messages.length,0);
  await call('/api/auth/logout',{method:'POST',cookie:a.cookie,body:{}});assert.equal((await call('/api/auth/me',{cookie:a.cookie})).status,401);
});
test('reject cross-origin writes, client IDs, oversized inputs and bad credentials',async t=>{
  const {call,login}=await fixture(t);
  assert.equal((await call('/api/auth/login',{method:'POST',origin:'https://evil.example',body:{}})).status,403);
  const a=await login();
  assert.equal((await call('/api/chat',{method:'POST',cookie:a.cookie,body:{message:'hi',user_id:2}})).status,400);
  assert.equal((await call('/api/chat',{method:'POST',cookie:a.cookie,body:{message:'a'.repeat(2001)}})).status,400);
  assert.equal((await call('/api/auth/login',{method:'POST',body:{role:'member',email:'member@demo.visionfit.local',password:'wrong'}})).status,401);
});
test('rate limit applies across sessions of same user',async t=>{
  const {call,login}=await fixture(t,{CHAT_LIMIT_PER_HOUR:'1'});
  const a=await login();assert.equal((await call('/api/chat',{method:'POST',cookie:a.cookie,body:{message:'hi'}})).status,200);
  const b=await login();assert.equal((await call('/api/chat',{method:'POST',cookie:b.cookie,body:{message:'hi'}})).status,429);
});
test('strict identity binding and field minimization',()=>{
  const user=identity({data:{id:1,gym_id:2,role:'member',name:'A'}},'member');
  assert.throws(()=>identity({data:{id:1,gym_id:2,role:'admin'}},'member'));
  assert.throws(()=>sanitizeContext({data:{subject:{id:2,gym_id:2,role:'member'}}},user));
  const c=sanitizeContext({data:{subject:{id:1,gym_id:2,role:'member'},profile:{goal:'Fit',password:'SECRET'},email:'private',summary:{assigned_members:99},packages:[]}},user);
  assert.equal(c.summary,null);assert.ok(!JSON.stringify(c).includes('SECRET'));assert.ok(!JSON.stringify(c).includes('private'));
});
test('live adapter forwards individual token, revalidates and fails closed',async t=>{
  let valid=true,mismatch=false; const received=[];
  const upstream=createServer(async(req,res)=>{
    received.push({url:req.url,auth:req.headers.authorization});res.setHeader('Content-Type','application/json');
    if(req.url==='/api/client/login') {res.end(JSON.stringify({status:true,token:'member-token'}));return;}
    if(!valid){res.writeHead(401);res.end('{}');return;}
    if(req.url==='/api/assistant/me'){res.end(JSON.stringify({data:{id:1,gym_id:10,role:'member',name:'Live member'}}));return;}
    if(req.url==='/api/assistant/context'){res.end(JSON.stringify({data:{subject:{id:mismatch?2:1,gym_id:10,role:'member'},packages:[],schedule:[]}}));return;}
    res.writeHead(404);res.end('{}');
  });
  await new Promise(r=>upstream.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>upstream.close(r)));
  const {call}=await fixture(t,{DATA_MODE:'live',VISIONFIT_API_URL:`http://127.0.0.1:${upstream.address().port}/api`});
  const login=()=>call('/api/auth/login',{method:'POST',body:{role:'member',email:'real@example.com',password:'secret'}});
  const a=await login();assert.equal(a.status,200);assert.equal(a.body.token,undefined);
  assert.equal((await call('/api/context',{cookie:a.cookie})).status,200);
  assert.ok(received.filter(x=>x.url.includes('/assistant/')).every(x=>x.auth==='Bearer member-token'));
  mismatch=true;assert.equal((await call('/api/chat',{method:'POST',cookie:a.cookie,body:{message:'hi'}})).status,403);
  assert.equal((await call('/api/messages',{cookie:a.cookie})).status,401);
  mismatch=false; const b=await login();valid=false;
  assert.equal((await call('/api/messages',{cookie:b.cookie})).status,401);
});
test('live AI uses minimized context and reports usage',async t=>{
  let payload;
  const upstream=createServer(async(req,res)=>{let raw='';for await(const c of req)raw+=c;payload=JSON.parse(raw);assert.equal(req.headers.authorization,'Bearer fake-test-key');res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:'Phản hồi thử nghiệm'}}],usage:{prompt_tokens:20,completion_tokens:5,total_tokens:25}}));});
  await new Promise(r=>upstream.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>upstream.close(r)));
  const {call,login}=await fixture(t,{AI_MODE:'live',AI_API_URL:`http://127.0.0.1:${upstream.address().port}/chat`,AI_API_KEY:'fake-test-key',AI_MODEL:'test-model'});
  const a=await login();const r=await call('/api/chat',{method:'POST',cookie:a.cookie,body:{message:'Xin chào'}});
  assert.equal(r.status,200);assert.equal(r.body.usage.total_tokens,25);assert.equal(payload.model,'test-model');assert.equal(payload.messages.at(-1).content,'Xin chào');assert.ok(!JSON.stringify(payload).includes('Demo123!'));
});
test('production rejects demo and unapproved data transfer',()=>{
  assert.throws(()=>config({NODE_ENV:'production'}));
  assert.throws(()=>config({DATA_MODE:'live',AI_MODE:'live',AI_API_KEY:'x',AI_MODEL:'x'}));
});
