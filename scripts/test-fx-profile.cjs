const {test}=require('node:test');
const assert=require('node:assert/strict');
const loader=require('./load-source.cjs');
const empty={quotes:{},stale:true,fetchedAt:0,error:null};
test('market reference fails over to Coinbase and rejects malformed backup rates',async()=>{
  const data={data:{currency:'USD',rates:{BTC:1/70000,ETH:1/2000,SOL:1/100,EUR:.9,GBP:.8}}};
  const api=loader({}, {fetch:async url=>{
    if(url.includes('kraken'))throw new Error('Timeout');
    return {ok:true,json:async()=>data};
  }})('src/lib/marketData.ts');
  const result=await api.getMarket();
  assert.equal(result.stale,false);assert.equal(result.quotes.BTC.price,70000);assert.equal(result.quotes.BTC.source,'Coinbase reference');
  assert.throws(()=>api.parseBackupRates({data:{currency:'USD',rates:{BTC:0}}}));
});
test('FX falls back when primary is unavailable and reuses one backup response across currencies',async()=>{
  let backup=0;
  const api=loader({}, {fetch:async url=>{
    if(url.includes('frankfurter')) throw new Error('Unavailable');
    backup++;
    return {ok:true,json:async()=>({result:'success',base_code:'USD',time_last_update_unix:Date.now()/1000,rates:{NGN:1500,GHS:15,EUR:.9}})};
  }})('src/lib/marketData.ts');
  assert.equal((await api.getConversion('NGN',empty)).rate,1500);
  assert.equal((await api.getConversion('GHS',empty)).rate,15);
  assert.equal((await api.getConversion('EUR',empty)).rate,.9);
  assert.equal(backup,1);
  assert.equal(api.peekConversion('NGN',empty).rate,1500);
});
test('FX retains valid cached rates during outages but refuses obsolete or invalid rates',async()=>{
  let now=Date.now(),offline=false;
  class Clock extends Date {static now(){return now}}
  const api=loader({}, {Date:Clock,fetch:async()=>{
    if(offline)throw new Error('Offline');
    return {ok:true,json:async()=>({rate:1500,date:new Date(now).toISOString().slice(0,10)})};
  }})('src/lib/marketData.ts');
  assert.equal((await api.getConversion('NGN',empty)).rate,1500);
  offline=true;now+=3600001;
  assert.equal((await api.getConversion('NGN',empty)).rate,1500);
  now+=8*86400000;
  await assert.rejects(api.getConversion('NGN',empty),/outdated/);
  const bad=loader({}, {fetch:async()=>({ok:true,json:async()=>({rate:-1,date:'invalid',result:'success',base_code:'USD',time_last_update_unix:0,rates:{NGN:0}})})})('src/lib/marketData.ts');
  await assert.rejects(bad.getConversion('NGN',empty));
});
test('profile validates name and international phone without accepting additional fields',()=>{
  const {profileDetails}=loader()('src/lib/profileValidation.ts');
  const value=profileDetails({name:'  Jane Smith  ',phone:'+234 800 000 0000',role:'admin'});
  assert.equal(value.name,'Jane Smith');assert.equal(value.phone,'+234 800 000 0000');assert.equal(value.role,undefined);
  for(const input of [{name:' '},{phone:'abc'},{phone:'123'},{phone:123},{name:{$gt:''}}]) assert.throws(()=>profileDetails(input));
});
