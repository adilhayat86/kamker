import assert from 'node:assert/strict';
import { randomUUID, randomBytes, scryptSync } from 'node:crypto';

const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (base !== 'http://127.0.0.1:55434') throw new Error('Refusing to run synthetic tests against any other database.');
const headers = { Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`, 'Content-Type': 'application/json' };
async function api(path, method = 'GET', body, privileged = true) {
  return fetch(`${base}/rest/v1/${path}`, {
    method, headers: { ...(privileged ? headers : { 'Content-Type': 'application/json' }), Prefer: 'return=representation' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function insert(table, values) {
  const response = await api(table, 'POST', values);
  assert.ok(response.ok, `Synthetic insert failed: ${table} (${response.status})`);
  return (await response.json())[0];
}
function hash(value) {
  const salt = randomBytes(16).toString('base64url');
  return `scrypt:${salt}:${scryptSync(value, salt, 64).toString('base64url')}`;
}

for (const table of ['professionals', 'customers', 'professional_sessions', 'customer_sessions', 'admin_passwords', 'manual_payments', 'media_upload_intents']) {
  assert.equal((await api(`${table}?select=*`, 'GET', null, false)).status, 401, `Anonymous read should fail for ${table}`);
  assert.equal((await api(table, 'POST', {}, false)).status, 401, `Anonymous write should fail for ${table}`);
}
assert.equal((await api('rpc/reserve_photo_upload', 'POST', {p_id:randomUUID(),p_owner:randomUUID(),p_folder:'professional-photos',p_public_id:'denied'},false)).status,401);
const owner = randomUUID();
const replies = await Promise.all(Array.from({length:14}, () => api('rpc/reserve_photo_upload', 'POST', {
  p_id: randomUUID(), p_owner: owner, p_folder:'professional-photos', p_public_id:randomUUID(),
})));
assert.equal(replies.filter(r => r.ok).length, 10, 'Concurrent requests must reserve exactly ten intents');
assert.equal(replies.filter(r => r.status === 400).length, 4, 'Remaining concurrent requests must be rejected');
console.log('PASS: direct anonymous API access denied; concurrent upload limit enforced.');

// Seed only synthetic accounts, never production accounts or receipt uploads.
const existing = await api('professionals?full_name=eq.Synthetic%20Security%20Worker&select=id');
if ((await existing.json()).length) {
  for (const [table,phone] of [['professionals','03000000001'],['customers','03000000002'],['customers','03000000003']]) {
    const response = await api(table+'?phone_number=eq.'+phone,'PATCH',{phone_normalized:'+92'+phone.slice(1)});
    assert.ok(response.ok);
  }
  console.log('Synthetic browser fixtures already exist.');
} else {
  const city = await insert('cities', {name:'Synthetic Test City'});
  const category = await insert('categories',{name:'Synthetic Test Service',slug:'synthetic-test-service',icon:'wrench'});
  const password = hash('Synthetic-Test-Only-2026!');
  const worker = await insert('professionals', {
    full_name:'Synthetic Security Worker',phone_number:'03000000001',phone_normalized:'+923000000001',
    password_hash:password,secret_question:'Synthetic test question?',secret_answer_hash:hash('synthetic'),
    city_id:city.id,category_id:category.id,is_active:true,is_banned:false,gender:'Male',age:25,
    availability_time:'full_time',availability_days:'seven_days',expected_rate:'500',
  });
  await insert('professionals',{full_name:'Synthetic Banned Worker',is_active:true,is_banned:true,city_id:city.id,category_id:category.id});
  const customer = await insert('customers',{full_name:'Synthetic Company Owner',phone_number:'03000000002',phone_normalized:'+923000000002',password_hash:password,city_id:city.id});
  const stranger = await insert('customers',{full_name:'Synthetic Stranger',phone_number:'03000000003',phone_normalized:'+923000000003',password_hash:password,city_id:city.id});
  const company = await insert('companies',{company_name:'Synthetic Owned Company',owner_user_id:customer.id,city:city.name,category:category.name,verification_status:'verified'});
  await insert('companies',{company_name:'Synthetic Private Company',owner_user_id:stranger.id,verification_status:'pending'});
  const requirement = await insert('requirements',{customer_id:customer.id,professional_id:null,required_service:'Synthetic test service',phone_number:'03000000002',city_id:city.id});
  for (const role of ['owner','manager']) await insert('admin_passwords',{role,password_hash:password});
  console.log(JSON.stringify({syntheticWorkerId:worker.id,syntheticCompanyId:company.id,syntheticRequirementId:requirement.id}));
}
