import assert from 'node:assert/strict';
import {test} from 'node:test';
const policy=await import('../src/scripts/motion/policy.ts').catch(()=>null);
test('shared functional interaction policy is implemented',()=>assert.ok(policy,'Functional interaction policy is missing'));
if(policy){
 const capable={width:1920,reduced:false,paused:false,hidden:false,cores:8,memory:8,coarse:false,saveData:false};
 test('preferences override capability hints',()=>{assert.equal(policy.motionPolicy({...capable,reduced:true}).mode,'reduced');assert.equal(policy.motionPolicy({...capable,paused:true}).mode,'paused');assert.equal(policy.motionPolicy({...capable,hidden:true}).mode,'hidden')});
 test('small layouts and limited resources reduce motion independently',()=>{assert.equal(policy.motionPolicy(capable).tier,'full');assert.equal(policy.motionPolicy({...capable,width:1366}).tier,'balanced');assert.equal(policy.motionPolicy({...capable,cores:2}).tier,'light');assert.equal(policy.motionPolicy({...capable,width:390}).tier,'light');assert.equal(policy.motionPolicy({...capable,saveData:true}).tier,'light')});
}
