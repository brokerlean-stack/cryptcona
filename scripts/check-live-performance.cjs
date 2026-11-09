const assert = require('node:assert/strict');
const { expect } = require('@playwright/test');
module.exports = async ({ browser, client, base }) => {
  const context = await browser.newContext({storageState:await client.storageState(),viewport:{width:1440,height:1000}});
  let currencyResolved = false, accountRequests = 0;
  try {
    await context.route('**/api/market?currency=*', async route => {await new Promise(r=>setTimeout(r,4000));currencyResolved=true;await route.continue().catch(()=>{});});
    const page=await context.newPage();page.on('request',req=>{if(req.url().includes('/api/paper-trading'))accountRequests++});
    const start=Date.now();await page.goto(base+'/dashboard/trading');await page.getByRole('heading',{name:'New position',exact:true}).waitFor({timeout:3000});
    const readyMs=Date.now()-start;assert.equal(currencyResolved,false,'Slow currency provider must not block account page rendering');
    await expect(page.locator('.sim-price > strong')).not.toHaveText('Unavailable');
    const firstPrice=await page.locator('.sim-price > strong').innerText();
    await expect.poll(()=>page.locator('.sim-price > strong').innerText()).not.toBe(firstPrice);
    await page.getByRole('img',{name:'Trading price chart',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Live',exact:true}).getAttribute('class'),'active');
    const before=accountRequests;
    await page.locator('.cc-sidebar a[href="/dashboard/wallet"]').click();
    await page.getByRole('button',{name:'Withdraw',exact:true}).waitFor();
    const back=Date.now();await page.locator('.cc-sidebar a[href="/dashboard/trading"]').click();
    await page.getByRole('heading',{name:'New position',exact:true}).waitFor();
    assert.equal(accountRequests,before,'Navigation should reuse the shared account provider');
    console.log(JSON.stringify({accountReadyWithSlowFxMs:readyMs,cachedReturnToTradingMs:Date.now()-back,anchoredPriceUpdates:true,accountRefetchesOnNavigation:accountRequests-before}));
  } finally {await context.close();}
};
