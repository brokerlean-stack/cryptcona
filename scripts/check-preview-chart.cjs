// Read-only preview check: never submits orders or changes account data.
require('@next/env').loadEnvConfig(process.cwd());
const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:3100/login');
    await page.getByLabel('Email address').fill(process.env.ADMIN_EMAIL);
    await page.getByLabel('Password',{exact:true}).fill(process.env.ADMIN_PASSWORD);
    await page.getByRole('button',{name:'Sign in',exact:true}).click();
    await page.waitForURL('**/admin');
    await page.goto('http://localhost:3100/dashboard/trading');
    const chart=page.getByRole('img',{name:'Trading price chart',exact:true});
    await chart.waitFor();
    const paths=new Set(),prices=new Set();
    for(let i=0;i<16;i++) {
      paths.add(await chart.locator('path[fill="none"]').getAttribute('d'));
      prices.add(await page.locator('.sim-price > strong').innerText());
      await page.waitForTimeout(550);
    }
    assert.ok(paths.size>=8,'Chart must keep changing');
    assert.ok(prices.size>=8,'Displayed prices must change');
    assert.deepEqual(errors,[]);
    await page.screenshot({path:'test-results/chart-recovery.png'});
    console.log(JSON.stringify({distinctChartPaths:paths.size,distinctPrices:prices.size,runtimeErrors:errors.length,ordersSubmitted:0}));
  }finally{await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
