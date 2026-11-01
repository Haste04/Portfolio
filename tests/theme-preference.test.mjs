import assert from 'node:assert/strict';
import {test} from 'node:test';
import vm from 'node:vm';
const theme=await import('../src/scripts/theme-preference.ts').catch(()=>null);
test('Theme preference and prepaint bootstrap exist',()=>assert.ok(theme));
if(theme){
 test('Only saved dark/light choices override the initial system scheme',()=>{
  assert.equal(theme.resolveTheme('dark',true),'dark');
  assert.equal(theme.resolveTheme('light',false),'light');
  assert.equal(theme.resolveTheme(null,true),'dark');
  assert.equal(theme.resolveTheme('invalid',false),'light');
 });
 test('Prepaint script sets root, native scheme and metadata before body parsing, including storage failure',()=>{
  for(const saved of ['dark','light',null,'invalid','throws'])for(const system of [false,true]){
   const root={dataset:{},style:{}},meta={content:''};
   vm.runInNewContext(theme.themeInitScript,{document:{documentElement:root,querySelector:()=>meta},localStorage:{getItem(){if(saved==='throws')throw Error('Denied');return saved}},matchMedia:()=>({matches:system})});
   const expected=theme.resolveTheme(saved==='throws'?null:saved,system);
   assert.equal(root.dataset.theme,expected);assert.equal(root.style.colorScheme,expected);
   assert.equal(meta.content,theme.themeColors[expected]);
  }
 });
}
