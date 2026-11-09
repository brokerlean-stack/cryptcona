const assert = require('node:assert/strict');
module.exports = async ({page,trader,base}) => {
  const failures=[];
  async function check(target,label) {
    await target.waitForTimeout(350);
    const size=await target.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    if(size.scroll>size.width+1) {
      await target.screenshot({path:'test-results/responsive-failure.png',fullPage:true});
      const offenders=await target.locator('body *').evaluateAll(elements=>elements.filter(el=>el.getBoundingClientRect().right>innerWidth+1 && getComputedStyle(el).position!=='fixed').slice(0,12).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right})));
      failures.push(label+' '+JSON.stringify({size,offenders}));
    }
  }
  for(const width of [320,390,768,1024]) {
    await trader.setViewportSize({width,height:900});
    for(const route of ['/dashboard','/dashboard/history','/dashboard/wallet','/dashboard/copy-trading','/dashboard/profile','/dashboard/settings','/dashboard/subscription','/dashboard/chat','/dashboard/trading']) {
      await trader.goto(base+route,{waitUntil:'domcontentloaded'});
      await check(trader,`${route} at ${width}`);
    }
    await page.setViewportSize({width,height:900});
    await page.goto(base+'/admin',{waitUntil:'domcontentloaded'});
    for(const label of ['Overview','Funding','Clients','Plans','Chats','Settings','Copy trading']) {
      const button=page.getByRole('button',{name:label,exact:true}).filter({visible:true}).first();
      await button.click();
      await check(page,`Admin ${label} at ${width}`);
    }
    await page.screenshot({path:`test-results/admin-${width}.png`,fullPage:true});
  }
  assert.deepEqual(failures,[]);
  console.log('Responsive checks passed at 320, 390, 768 and 1024 pixels: customer pages and every admin tab.');
};
