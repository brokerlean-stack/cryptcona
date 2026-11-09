const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const {parseStreamTicker}=require('./load-source.cjs')()('src/lib/marketStream.ts');
test('streamed prices use exact exchange last trades and reject malformed messages',()=>{
  const tick={symbol:'BTC/USD',last:75600.12,bid:75600.1,ask:75600.2,change_pct:-.3};
  const parsed=parseStreamTicker({channel:'ticker',data:[tick]},123);
  assert.equal(parsed.BTC.price,75600.12);assert.equal(parsed.BTC.fetchedAt,123);assert.equal(parsed.BTC.changeLabel,'24h');
  assert.equal(Object.keys(parseStreamTicker({channel:'heartbeat'})).length,0);
  assert.equal(Object.keys(parseStreamTicker({channel:'ticker',data:[{...tick,last:NaN},{...tick,symbol:'UNKNOWN/USD'},{...tick,bid:80000}]})).length,0);
  assert.equal(parseStreamTicker({channel:'ticker',data:[tick]},999).BTC.price,parsed.BTC.price,'No random or clock-based price movement');
});
test('user-facing simulation disclosure literals are centralized in Demo.tsx',()=>{
  const violations=[];
  function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else if(/\.(tsx?|js)$/.test(file)&&!file.endsWith(path.join('components','Demo.tsx'))){
    const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    function visit(n){if(ts.isStringLiteral(n)||ts.isJsxText(n)){const text=n.text;if(/\b(no real money|virtual funds|simulated orders|demo profiles? cannot|close simulation details)\b/i.test(text))violations.push(file+': '+text);}ts.forEachChild(n,visit)}visit(source);
  }}}walk('src');assert.deepEqual(violations,[]);
});
