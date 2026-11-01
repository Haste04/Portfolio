import assert from 'node:assert/strict';
import {test} from 'node:test';
import {educationPlaces,educationPoint} from '../src/data/education.ts';
import {fullEducationView,educationFocusView,educationCameraPoint} from '../src/scripts/education-camera.ts';
test('Education camera clamps zoom and keeps every journey point visible for each focus',()=>{
 for(const place of educationPlaces){
  const focus=educationPoint(place.coordinates),view=educationFocusView(focus);
  assert.equal(view.scale,1.85);assert.ok(view.x<=0&&view.y<=0);
  const selected=educationCameraPoint(focus,view);
  assert.ok(selected[0]>240&&selected[0]<360&&selected[1]>280&&selected[1]<380);
  for(const other of educationPlaces){
   const [x,y]=educationCameraPoint(educationPoint(other.coordinates),view);
   assert.ok(x>=32&&x<=568&&y>=32&&y<=588,place.id+' keeps '+other.id+' visible: '+[x,y]);
  }
  assert.equal(educationFocusView(focus,100).scale,1.85);
  assert.deepEqual(educationFocusView(focus,0),fullEducationView);
 }
});
test('Full Philippines camera leaves geography and connector coordinates unchanged',()=>{
 for(const place of educationPlaces){
  const point=educationPoint(place.coordinates);
  assert.deepEqual(educationCameraPoint(point,fullEducationView),point);
 }
});
