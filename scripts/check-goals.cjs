const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
module.exports=async({context,client,base,userId,mongoose})=>{
  const request=client.request,users=mongoose.connection.collection('users');
  const dashboard=async()=>(await request.get(base+'/api/dashboard')).json();
  const update=data=>request.post(base+'/api/user/profit-goal',{data});
  let data=await dashboard();
  assert.equal(data.goal.target,2000);
  assert.equal(data.goal.reached,false);
  assert.equal((await update({target:3000})).status(),409);
  assert.equal((await update({target:'1e4'})).status(),400);
  const user=await users.findOne({_id:new mongoose.Types.ObjectId(userId)});
  assert.equal(user.termsVersion,'2026-11-07');
  await users.updateOne({_id:user._id},{$set:{withdrawalCode:'test-only-code'}});
  const withdrawal=await request.post(base+'/api/wallet/withdraw',{data:{amount:1,method:'TEST',walletAddress:'test-destination',withdrawalCode:'test-only-code'}});
  assert.equal(withdrawal.status(),200,'An incomplete goal must not block withdrawal');
  assert.equal((await update({disable:true})).status(),200);
  assert.equal((await dashboard()).goal.target,0);
  assert.equal((await update({target:20})).status(),200);
  assert.equal((await dashboard()).goal.progress,0);
  await mongoose.connection.collection('trades').insertMany([
    {userId:user._id,asset:'TEST',type:'BUY',amount:100,payout:150,status:'WIN',createdAt:new Date()},
    {userId:user._id,asset:'TEST',type:'BUY',amount:100,payout:80,status:'LOSS',createdAt:new Date()},
  ]);
  data=await dashboard();assert.equal(data.goal.progress,30);assert.equal(data.goal.reached,true);
  assert.equal((await update({target:100})).status(),200);
  assert.equal((await dashboard()).goal.progress,0);
  const before=(await dashboard()).user.balance;
  assert.equal((await request.post(base+'/api/trade',{data:{asset:'TEST',type:'BUY',amount:10,duration:60}})).status(),503);
  assert.equal((await dashboard()).user.balance,before);
  const template=await mongoose.connection.collection('copyprofiles').findOne({active:true});
  const demo=await mongoose.connection.collection('copyprofiles').insertOne({...template,_id:new mongoose.Types.ObjectId(),name:'Fictional Test (Demo)',isDemo:true});
  assert.equal((await request.post(base+'/api/copy-trading',{data:{profileId:String(demo.insertedId)}})).status(),200);
  const current=await users.findOne({_id:user._id});
  const credit=await context.request.post(base+'/api/admin/copy-trading/credit',{data:{userId:String(user._id),profileId:String(demo.insertedId),copySessionId:current.copySessionId,amount:10,note:'Must not create funds',requestId:randomUUID()}});
  assert.equal(credit.status(),409);
  assert.equal((await dashboard()).user.balance,before);
  const registration=await request.post(base+'/api/auth/register',{data:{name:'No consent',email:'no-consent@example.test',password:'test-long-password',country:'NG',currency:'NGN',profitGoal:100}});
  assert.equal(registration.status(),400);
  assert.equal((await context.request.post(base+'/api/user/profit-goal',{data:{target:100}})).status(),200,'Existing accounts without a stored goal can set one');
  console.log('Goals passed: signup consent, progress and net P&L, lock/reset/disable, withdrawals unaffected, demo credits rejected and random funded trades disabled.');
};
