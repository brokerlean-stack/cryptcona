const {test}=require('node:test');
const assert=require('node:assert/strict');
const mongoose=require('mongoose'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/clientData.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:mod.exports,JSON});
test('admin props serialize nested BSON references, populated users, dates and Mixed settings',()=>{
  const id=new mongoose.Types.ObjectId(),date=new Date('2026-11-07T00:00:00Z');
  const result=mod.exports.toClientData({users:[{_id:id,copyProfileId:id,copyStartedAt:date}],deposits:[{_id:id,userId:{_id:id},copyCreditId:id}],withdrawals:[{userId:null,createdAt:date}],settings:[{value:{nested:[id,date]}}]});
  assert.equal(result.users[0].copyProfileId,id.toHexString());
  assert.equal(result.users[0].copyStartedAt,date.toISOString());
  assert.equal(result.deposits[0].userId._id,id.toHexString());
  assert.equal(result.settings[0].value.nested[0],id.toHexString());
  function plain(value){if(value&&typeof value==='object'){assert.ok(Array.isArray(value)||Object.getPrototypeOf(value)===Object.prototype);assert.equal(typeof value.toJSON,'undefined');for(const child of Object.values(value))plain(child);}}
  plain(result);
});
