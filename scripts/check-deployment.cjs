// Reports configuration presence only; never prints credential values.
require('@next/env').loadEnvConfig(process.cwd());
const fs=require('node:fs');
const failures=[];
for(const key of ['MONGODB_URI','MONGODB_DB_NAME','NEXTAUTH_URL','NEXT_PUBLIC_SITE_URL','NEXTAUTH_SECRET','IMAGEKIT_PRIVATE_KEY','IMAGEKIT_URL_ENDPOINT','RESEND_API_KEY','RESEND_FROM_EMAIL']) {
  if(!process.env[key]) failures.push(`${key} is missing`);
}
for(const key of ['NEXTAUTH_URL','NEXT_PUBLIC_SITE_URL']) {
  if(process.env[key]!=='https://cryptcona.pro') failures.push(`${key} must be https://cryptcona.pro`);
}
if((process.env.NEXTAUTH_SECRET||'').length<32) failures.push('Session secret must have at least 32 characters');
if(!fs.existsSync('.next/standalone/server.js')) failures.push('Run npm run build first');
for(const file of ['.env','.env.local','.env.production','.env.production.local']) {
  if(fs.existsSync('.next/standalone/'+file)) failures.push(`Build contains ${file}; rebuild before packaging`);
}
if(failures.length){for(const error of failures) console.error('FAIL:',error);process.exitCode=1}
else console.log('Deployment configuration and standalone artifact checks passed. External delivery and hosting still require verification.');
