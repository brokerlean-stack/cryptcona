const {test}=require('node:test');
const assert=require('node:assert/strict');
const mongoose=require('mongoose');
const {MongoMemoryReplSet}=require('mongodb-memory-server');
const loader=require('./load-source.cjs');
const {anchoredStep}=loader()('src/lib/anchoredPriceMath.ts');
test('anchored price path moves both directions and remains inside the real-price band',()=>{
  const reference=70988;
  assert.ok(anchoredStep(reference,reference,.1,.5)<reference);
  assert.ok(anchoredStep(reference,reference,.9,.5)>reference);
  let p=reference,up=0,down=0;
  for(let i=0;i<10000;i++){const next=anchoredStep(p,reference,(i*7919%1000)/1000,(i*1789%1000)/1000);assert.ok(next>=reference*.96&&next<=reference*1.04);if(next>p)up++;if(next<p)down++;p=next;}
  assert.ok(up>3000&&down>3000);assert.ok(anchoredStep(reference*2,reference,.99,1)<=reference*1.04);
  assert.ok(anchoredStep(reference*.1,reference,0,1)>=reference*.96);
});
test('shared ticks keep moving during provider outages, expire after one day, and recover',async()=>{
  const mongo=await MongoMemoryReplSet.create({replSet:{count:1},binary:{version:'8.0.17'}});
  try{
    await mongoose.connect(mongo.getUri(),{dbName:'anchor_test'});
    let now=Date.now(),fresh=true;
    class Clock extends Date{static now(){return now}}
    const ids=['BTC','ETH','SOL','EUR','GBP'];
    const quote=()=>({quotes:Object.fromEntries(ids.map(id=>[id,{price:70988,bid:70988,ask:70988,fetchedAt:now,source:'test'}])),fetchedAt:now,stale:!fresh});
    const deps={'./db':async()=>{},'./marketData':{getMarket:async()=>quote(),peekMarket:()=>quote(),MARKET_PAIRS:Object.fromEntries(ids.map(id=>[id,id]))}};
    const first=loader(deps,{Date:Clock}),second=loader(deps,{Date:Clock});
    const Model=first('src/models/PracticeMarket.ts').default;await Model.init();
    const a=first('src/lib/anchoredMarket.ts'),b=second('src/lib/anchoredMarket.ts');
    const values=await Promise.all([a.getAnchoredMarket(),b.getAnchoredMarket(),a.getAnchoredMarket()]);
    assert.equal(values[0].quotes.BTC.price,values[1].quotes.BTC.price);assert.equal(values[0].quotes.BTC.price,values[2].quotes.BTC.price);
    now+=600;
    const next=await b.getAnchoredMarket();assert.ok(next.series.BTC.length>=2);assert.equal(next.quotes.BTC.reference,70988);assert.ok(next.quotes.BTC.price>=68148.48&&next.quotes.BTC.price<=73827.52);
    fresh=false;now+=61000;
    const continued=await a.getAnchoredMarket();assert.equal(continued.stale,false);assert.ok(continued.fetchedAt>next.fetchedAt);assert.equal(continued.referenceAt,next.referenceAt);
    assert.ok(continued.quotes.BTC.price>=68148.48&&continued.quotes.BTC.price<=73827.52);
    // A never-resolving provider refresh must not block the half-second path.
    deps['./marketData'].getMarket=()=>new Promise(()=>{});
    now+=500;
    const immediate=await b.getAnchoredMarket();assert.ok(immediate.fetchedAt>continued.fetchedAt);
    deps['./marketData'].getMarket=async()=>quote();
    now+=25*3600000;
    const paused=await a.getAnchoredMarket();assert.equal(paused.stale,true);assert.equal(paused.quotes.BTC.price,immediate.quotes.BTC.price);
    fresh=true;now+=500;
    const recovered=await a.getAnchoredMarket();assert.equal(recovered.stale,false);assert.equal(recovered.referenceAt,now);
  }finally{await mongoose.disconnect();await mongo.stop()}
});
