import assert from 'node:assert/strict';
import {test} from 'node:test';
import {influence,segmentDistance,ringDistance} from '../src/scripts/living-canvas/proximity.ts';
test('Proximity falls off smoothly, is bounded, and rejects invalid radii',()=>{
 assert.equal(influence(0,180),1);assert.equal(influence(180,180),0);
 assert.equal(influence(300,180),0);assert.equal(influence(20,0),0);
 assert.ok(influence(60,180)>influence(120,180));assert.equal(influence(-1,180),1);
});
test('Segment distance handles endpoints, projections, and zero-length links',()=>{
 assert.equal(segmentDistance(5,3,0,0,10,0),3);
 assert.equal(segmentDistance(-3,4,0,0,10,0),5);
 assert.equal(segmentDistance(3,4,0,0,0,0),5);
});
test('Ring proximity uses visible elliptical boundary rather than its empty center',()=>{
 assert.equal(ringDistance(100,0,0,0,100,50),0);
 assert.equal(ringDistance(0,0,0,0,100,50),50);
 assert.ok(ringDistance(110,0,0,0,100,50)<11);
});
