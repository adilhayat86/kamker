import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base='http://127.0.0.1:3103', db=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(db!=='http://127.0.0.1:55434')throw new Error('Synthetic local database required.');
const service={Authorization:`Bearer ${process.env.SUPABASE_SECRET_KEY}`,'Content-Type':'application/json'};
async function rows(table,query){const r=await fetch(`${db}/rest/v1/${table}?${query}`,{headers:service});assert.ok(r.ok);return r.json();}
const worker=(await rows('professionals','full_name=eq.Synthetic%20Security%20Worker&select=id'))[0];
const outsider=(await rows('customers','full_name=eq.Synthetic%20Stranger&select=id'))[0];
const jar=new Map();
async function request(path,options={}){
 const r=await fetch(base+path,{...options,redirect:'manual',headers:{Origin:base,Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),...options.headers}});
 for(const h of r.headers.getSetCookie()){const p=h.split(';')[0],i=p.indexOf('=');jar.set(p.slice(0,i),p.slice(i+1));}return r;
}
function form(html){const action=html.match(/name="(\$ACTION_ID_[^"]+)"/);assert.ok(action);const f=new FormData();f.set(action[1],'');return f;}
let loginForm=form(await(await request('/login')).text());loginForm.set('phone','03000000001');loginForm.set('password','Synthetic-Test-Only-2026!');assert.equal((await request('/login',{method:'POST',body:loginForm})).status,303);
const signedResponse=await request('/api/cloudinary/sign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({folder:'professional-photos'})});assert.equal(signedResponse.status,200);
const signed=await signedResponse.json();
assert.equal(signed.cloudName,'kamker-synthetic-local');
assert.ok(signed.folder.endsWith('/'+worker.id));
async function save(id){const f=form(await(await request('/account/photo')).text());f.set('photoIntentId',id);return request('/account/photo',{method:'POST',body:f});}
const saved=await save(signed.intentId);assert.equal(saved.status,303);assert.equal(saved.headers.get('location'),'/account?status=photo-saved');
const expected=`https://res.cloudinary.com/kamker-synthetic-local/image/upload/v12345/${signed.folder}/${signed.publicId}.jpg`;
async function attached(){return(await rows('professionals',`id=eq.${worker.id}&select=profile_photo_url`))[0].profile_photo_url;}
assert.equal(await attached(),expected);
assert.ok((await(await request('/account?status=photo-saved')).text()).includes('profile saved successfully'));
await save(signed.intentId);
const events=await rows('analytics_events',`event_type=eq.photo_attached&target_id=eq.${worker.id}&select=id`);assert.ok(events.length>=1);
async function intent(owner,id=randomUUID(),expires){const public_id=`kamker/professional-photos/${owner}/${id}`;const r=await fetch(db+'/rest/v1/media_upload_intents',{method:'POST',headers:service,body:JSON.stringify({id,owner_id:owner,folder:'professional-photos',public_id,...(expires?{expires_at:expires}:{})})});assert.ok(r.ok);return id;}
for(const id of [await intent(outsider.id),await intent(worker.id,randomUUID(),new Date(Date.now()-1000).toISOString()),await intent(worker.id,'ffffffff-ffff-4fff-8fff-ffffffffffff')]){
 const rejected=await save(id);assert.ok(rejected.headers.get('location')?.includes('photo-error'));assert.equal(await attached(),expected);
}
console.log('PASS: authenticated signing, successful checked photo attachment, JPEG delivery, repeated save, and preservation on foreign/expired/oversized assets (provider fixture).');
const ownProof='/api/proofs?path='+encodeURIComponent(`featured_profile/${worker.id}/synthetic-receipt.jpg`);
const proof=await request(ownProof);assert.equal(proof.status,307);assert.ok(proof.headers.get('location')?.includes('synthetic-test-token'));assert.ok(proof.headers.get('cache-control')?.includes('no-store'));
const denied=await request('/api/proofs?path='+encodeURIComponent(`featured_profile/${outsider.id}/synthetic-receipt.jpg`));assert.equal(denied.status,404);
console.log('PASS: proof route checks owner before issuing short-lived private access; wrong account denied (storage fixture, no receipts uploaded).');
