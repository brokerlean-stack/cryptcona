const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(env={IMAGEKIT_PRIVATE_KEY:'test',IMAGEKIT_URL_ENDPOINT:'https://ik.imagekit.io/test'}) {
  const calls=[];
  class FakeClient { constructor(){this.files={upload:async data=>{calls.push(data);return {fileId:'file',filePath:'/test/image.png',url:'https://ik.imagekit.io/test/image.png'};},delete:async()=>{}};} }
  const mod={exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/imagekit.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,{
    exports:mod.exports,module:mod,Buffer,process:{env},require:name=>name==='@imagekit/nodejs'?{__esModule:true,default:FakeClient,toFile:async bytes=>bytes}:name==='@/models/Media'?{__esModule:true,default:{create:async data=>{calls.push(data);return {_id:'media-id'};}}}:require(name)
  });
  return {...mod.exports,calls};
}
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6lJ8AAAAASUVORK5CYII=';
test('image validation rejects forged signatures, unsupported formats and oversized data',()=>{
  const {decodeImage}=load();
  assert.equal(decodeImage(png,1024).type,'png');
  for(const image of ['data:image/png;base64,AAAA','data:image/svg+xml;base64,AAAA','https://example.test/image.png',null])assert.throws(()=>decodeImage(image,1024));
  assert.throws(()=>decodeImage(png,4));
});
test('missing ImageKit credentials fails without storing base64',async()=>{
  const api=load({});
  await assert.rejects(api.storeImage(png,'profiles','owner'),error=>error.status===503);
  assert.equal(api.calls.length,0);
});
test('profile photos upload publicly and return only their CDN URL',async()=>{
  const api=load();
  assert.match(await api.storeImage(png,'profiles','owner'),/^https:/);
  assert.equal(api.calls[0].isPrivateFile,false);
  assert.equal(api.calls[0].folder,'/cryptcona/profiles/owner');
});
test('chat and identity images are private and store provider references',async()=>{
  for(const purpose of ['support','identity']) {
    const api=load();
    assert.equal(await api.storeImage(png,purpose,'owner'),'/api/media/media-id');
    assert.equal(api.calls[0].isPrivateFile,true);
    assert.equal(api.calls[1].ownerId,'owner');
    assert.equal(api.calls[1].fileId,'file');
  }
});
