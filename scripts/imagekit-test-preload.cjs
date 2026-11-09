// Loaded ONLY by the isolated browser test process. No real ImageKit requests.
const originalFetch = globalThis.fetch;
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  // Public market fixtures exist only in this isolated test process.
  if (url.startsWith('https://api.kraken.com/')) {
    const pairs = {XXBTZUSD:1000,XETHZUSD:100,SOLUSD:.5,ZEURZUSD:1.1,ZGBPZUSD:1.3};
    if (url.includes('/Ticker')) return Response.json({error:[],result:Object.fromEntries(Object.entries(pairs).map(([key,p])=>[key,{c:[String(p)],b:[String(p*.999)],a:[String(p*1.001)],o:String(p*.99)}]))});
    const pair = new URL(url).searchParams.get('pair');
    const price = pairs[pair];
    return Response.json({error:[],result:{[pair]:Array.from({length:90},(_,i)=>[Math.floor(Date.now()/60000)*60-(89-i)*60,price,price,price,price,'0',1,1]),last:Math.floor(Date.now()/1000)}});
  }
  // Exercise the production fallback for NGN throughout the trading browser suite.
  if (url.startsWith('https://api.frankfurter.dev/')) return new Response('Provider unavailable',{status:503});
  if (url.startsWith('https://open.er-api.com/')) return Response.json({result:'success',base_code:'USD',time_last_update_unix:Date.now()/1000,rates:{NGN:1500,EUR:1/1.1,GBP:1/1.3}});
  if (url.startsWith('https://upload.imagekit.io/')) {
    const request = new Request(input, init);
    const form = await request.formData();
    const file = form.get('file');
    if (!file || !form.get('folder')?.startsWith('/cryptcona/')) throw new Error('Invalid upload');
    const filePath = `/test/${randomUUID()}.png`;
    return Response.json({fileId:randomUUID(),filePath,url:'http://127.0.0.1:3101/trading-team.png'});
  }
  if (url.startsWith('https://ik.imagekit.io/cryptcona-test/')) {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('ik-s') || !parsed.searchParams.has('ik-t')) return new Response('',{status:401});
    return new Response(fs.readFileSync('public/trading-team.png'),{headers:{'content-type':'image/png'}});
  }
  return originalFetch(input, init);
};
