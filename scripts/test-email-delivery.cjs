// Opt-in LIVE send. Uses a disposable Mail.tm inbox and the application's mail helper.
// Inbox credentials stay in memory; the report contains delivery metadata only.
if (!process.argv.includes('--send')) {
  console.error('This sends one real test email. Run explicitly with --send.');
  process.exit(1);
}
require('@next/env').loadEnvConfig(process.cwd());
const {randomBytes}=require('node:crypto');
const {mkdirSync,writeFileSync}=require('node:fs');
const {Resend}=require('resend');
const loadSource=require('./load-source.cjs');
const report={startedAt:new Date().toISOString(),provider:'Mail.tm',delivered:false};
async function mailbox(path,options={}) {
  for(let attempt=0;attempt<4;attempt++){
    try {
      const response=await fetch('https://api.mail.tm'+path,{...options,headers:{Accept:'application/ld+json',...options.headers},signal:AbortSignal.timeout(15000)});
      const body=await response.text();
      if(!response.ok||!body)throw new Error('Temporary mailbox request failed: '+response.status+' '+path);
      return JSON.parse(body);
    }catch(error){if(attempt===3)throw error;await new Promise(resolve=>setTimeout(resolve,3000));}
  }
}
function save(){mkdirSync('test-results',{recursive:true});writeFileSync('test-results/email-delivery.json',JSON.stringify(report,null,2));}
(async()=>{
  const domains=await mailbox('/domains');
  const domain=domains['hydra:member'].find(d=>d.isActive&&!d.isPrivate)?.domain;
  if(!domain)throw new Error('No temporary mailbox domain available');
  const marker=randomBytes(8).toString('hex');
  const address='cryptcona-check-'+marker+'@'+domain;
  const password=randomBytes(32).toString('hex');
  const options={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,password})};
  await mailbox('/accounts',options);
  const {token}=await mailbox('/token',options);
  const headers={Authorization:'Bearer '+token};
  report.recipient=address;
  report.sender=process.env.RESEND_FROM_EMAIL;
  report.subject='Delivery test '+marker+' | Cryptcona Broker';
  const app=loadSource({resend:{Resend:class {
    constructor(key){const real=new Resend(key);this.emails={send:async args=>{
      const result=await real.emails.send(args);
      report.resendId=result.data?.id;
      if(result.error)report.sendError={name:result.error.name,message:result.error.message};
      save();return result;
    }}}
  }}}, {URL})('src/lib/mail.ts');
  console.log('Temporary inbox created:',address);
  await app.sendCustomTemplateEmail(address,'Delivery test '+marker,'Email delivery check',
    'This is an authorized email-delivery test for Cryptcona Broker. Reference: '+marker+'. No account action is required.');
  console.log('Resend accepted the message. Checking the destination inbox...');
  for(let attempt=0;attempt<36;attempt++){
    try {
    const messages=await mailbox('/messages',{headers});
    const message=messages['hydra:member'].find(m=>m.subject.includes(marker));
    if(message){
      const received=await mailbox('/messages/'+message.id,{headers});
      report.delivered=true;report.receivedAt=received.createdAt;report.receivedFrom=received.from?.address;
      report.subject=received.subject;
      report.bodyVerified=JSON.stringify([received.text,received.html]).includes(marker);
      report.senderVerified=received.from?.address==='support@cryptcona.pro';
      report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify(report));return;
    }
    } catch(error) { report.lastInboxError=error.message; }
    if(attempt%6===0)console.log('Waiting for inbox delivery...');
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
  throw new Error('Resend accepted the message, but it did not arrive within the three-minute observation window.');
})().catch(error=>{report.error=error.message;report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify(report));process.exitCode=1});
