import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:3100';
const db = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (db !== 'http://127.0.0.1:55434') throw new Error('Synthetic local database required.');
const password = 'Synthetic-Test-Only-2026!';
const serviceHeaders = { Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}` };
async function record(table, filter, select = 'id') {
  const r = await fetch(`${db}/rest/v1/${table}?${filter}&select=${select}`, { headers: serviceHeaders });
  assert.ok(r.ok, `Fixture lookup failed (${table})`);
  return (await r.json())[0];
}
function actor() {
  const cookies = new Map();
  return { cookies, async request(path, options = {}) {
    const r = await fetch(new URL(path, base), { ...options, redirect: 'manual',
      headers: { Origin: base, Cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; '), ...options.headers } });
    for (const raw of r.headers.getSetCookie()) {
      const pair = raw.split(';')[0], eq = pair.indexOf('=');
      cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
    return r;
  }};
}
function form(html, marker = '') {
  const forms = html.match(/<form\b[\s\S]*?<\/form>/g) ?? [];
  const selected = forms.find(f => f.includes(marker) && f.includes('$ACTION_'));
  assert.ok(selected, `Server form missing: ${marker}`);
  const data = new FormData();
  for (const input of selected.match(/<input\b[^>]*>/g) ?? []) {
    const name = input.match(/name="([^"]+)"/)?.[1];
    if (name && (input.includes('type="hidden"') || name.startsWith('$ACTION_'))) {
      data.set(name, (input.match(/value="([^"]*)"/)?.[1] ?? '').replaceAll('&amp;', '&'));
    }
  }
  return data;
}
async function submit(who, path, fields, marker = '', prepared) {
  const body = prepared ?? form(await (await who.request(path)).text(), marker);
  for (const [k,v] of Object.entries(fields)) body.set(k, v);
  return who.request(path, { method: 'POST', body });
}
async function login(phone, role) {
  const who = actor();
  const r = await submit(who, role ? '/admin/login' : '/login', role ? { role, password } : { phone, password });
  assert.equal(r.status, 303, 'Login should redirect after success');
  assert.ok(!r.headers.get('location')?.includes('invalid'), 'Synthetic login must succeed');
  return who;
}
async function expectLoginRedirect(response) {
  if ([303,307].includes(response.status)) { assert.ok(response.headers.get('location')?.includes('/login')); return; }
  const html = await response.text();
  assert.ok(/<meta id="__next-page-redirect"[^>]+content="[^"]*url=\/login/.test(html), 'Streamed page must redirect to login');
  assert.ok(!html.includes('Synthetic Security Worker'));
}
async function expectNotFound(response) {
  const html = await response.text();
  assert.ok(response.status === 404 || html.includes('NEXT_HTTP_ERROR_FALLBACK;404'), 'Access must resolve to not found');
  assert.ok(!html.includes('Synthetic Owned Company'));
}
const workerRow = await record('professionals', 'full_name=eq.Synthetic%20Security%20Worker');
const company = await record('companies', 'company_name=eq.Synthetic%20Owned%20Company');
const requirement = await record('requirements', 'required_service=eq.Synthetic%20test%20service');
const companyPath = `/companies/${company.id}/dashboard`;
const paymentPath = `/send-requirement/${requirement.id}/payment`;
const nobody = actor();
await expectLoginRedirect(await nobody.request('/account'));
assert.ok([303,307].includes((await nobody.request('/admin')).status));
await expectNotFound(await nobody.request(companyPath));
assert.equal((await nobody.request('/api/proofs?path=featured_profile/foreign/receipt.jpg')).status,404);
assert.equal((await nobody.request('/api/cloudinary/sign',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"folder":"professional-photos"}'})).status,401);
console.log('PASS: signed-out account/admin/company/proof/upload access denied.');

const worker = await login('03000000001');
const accountHtml = await (await worker.request('/account')).text();
assert.ok(accountHtml.includes('Synthetic Security Worker'));
assert.ok(!accountHtml.includes('scrypt:') && !accountHtml.includes('secret_answer_hash'));
await expectNotFound(await worker.request(companyPath));
await expectNotFound(await worker.request(paymentPath));
const photo = await submit(worker,'/account/photo',{profilePhotoUrl:'https://attacker.invalid/photo.jpg'});
assert.ok(photo.headers.get('location')?.includes('choose-photo'));
const badIntent = await submit(worker,'/account/photo',{photoIntentId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'});
assert.ok(badIntent.headers.get('location')?.includes('photo-error'));
console.log('PASS: worker login, private HTML, wrong-role protection and arbitrary/unowned photo rejection.');

const customer = await login('03000000002');
const stranger = await login('03000000003');
assert.equal((await customer.request(companyPath)).status,200);
assert.equal((await customer.request(paymentPath)).status,200);
await expectNotFound(await stranger.request(companyPath));
await expectNotFound(await stranger.request(paymentPath));
const dashboard = await (await customer.request(companyPath)).text();
const forged = form(dashboard, 'name="logo"');
const mutation = await submit(stranger,companyPath,{companyId:company.id},'',forged);
await expectNotFound(mutation);
assert.equal((await stranger.request(`/send-requirement/${requirement.id}/broadcast-report`)).status,403);
console.log('PASS: company/requirement owner allowed; another customer denied reads, mutation and report export.');

const owner = await login(null,'owner');
const manager = await login(null,'manager');
assert.equal((await owner.request('/admin/system')).status,200);
assert.equal((await manager.request('/admin/workers')).status,200);
const passwordForm = form(await (await owner.request('/admin/change-password')).text(), 'name="newPassword"');
const denied = await submit(manager,'/admin/change-password',{role:'owner',newPassword:'Unusable-Synthetic-Change',confirmPassword:'Unusable-Synthetic-Change'},'',passwordForm);
assert.ok(denied.headers.get('location')?.includes('owner-required'));
const sign = await owner.request('/api/cloudinary/sign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({folder:'company-staff',companyId:company.id})});
assert.equal(sign.status,503,'Admin is authorised and reaches the deliberately unconfigured local media provider');
const invalidAdmin = actor();
invalidAdmin.cookies.set('kamker_admin_session_v2','admin:owner:9999999999999:invalid');
assert.ok([303,307].includes((await invalidAdmin.request('/admin')).status));
console.log('PASS: owner/manager login and management; owner-only password action; admin media authorisation; invalid admin cookie rejected.');

// Delete this synthetic worker's sessions only, then prove old cookies fail and
// the unchanged password can still create a new session.
const cleared = await fetch(`${db}/rest/v1/professional_sessions?professional_id=eq.${workerRow.id}`, {method:'DELETE',headers:serviceHeaders});
assert.ok(cleared.ok);
await expectLoginRedirect(await worker.request('/account'));
const relogged = await login('03000000001');
assert.equal((await relogged.request('/account')).status,200);
console.log('PASS: revoked worker session fails; unchanged password logs in again.');

const stamp = String(Date.now()).slice(-7);
const newWorker = actor();
const missing = await submit(newWorker,'/register/professional',{fullName:'Synthetic Incomplete'});
assert.ok(missing.headers.get('location')?.includes('status=missing'));
const workerPhone = '0301'+stamp;
const workerName = 'Synthetic Registration '+stamp;
const registered = await submit(newWorker,'/register/professional',{
  fullName:workerName,phone:workerPhone,city:'Synthetic Test City',category:'Synthetic Test Service',gender:'Male',age:'25',availabilityTime:'full_time',availabilityDays:'seven_days',rate:'500',password,
});
assert.ok(registered.headers.get('location')?.includes('/account/photo?status=registered'),'Successful signup must go directly to the photo step');
assert.ok((await (await newWorker.request('/account/photo?status=registered')).text()).includes('Add your photo'));
await newWorker.request('/account/photo?status=registered');
const signupRows = await fetch(db+'/rest/v1/professionals?full_name=eq.'+encodeURIComponent(workerName)+'&select=id',{headers:serviceHeaders});
assert.equal((await signupRows.json()).length,1,'Refreshing the landing step must not duplicate the worker');
assert.ok((await (await newWorker.request('/account')).text()).includes(workerName));
console.log('PASS: registration validation, successful signup, optional photo landing and refresh safety.');

const newCustomer = actor();
const newCustomerName = 'Synthetic New Customer '+stamp;
const customerResult = await submit(newCustomer,'/register/customer?next=%2Fregister%2Fcompany',{
  fullName:newCustomerName,phone:'0302'+stamp,city:'Synthetic Test City',password,next:'/register/company',
});
assert.ok(customerResult.headers.get('location')?.startsWith('/register/company'));
const companyName = 'Synthetic New Company '+stamp;
const companyResult = await submit(newCustomer,'/register/company',{
  companyName,category:'Synthetic Test Service',city:'Synthetic Test City',contactPerson:'Synthetic Contact',phone:'0302'+stamp,description:'Synthetic company fixture only.',
});
assert.ok(companyResult.headers.get('location')?.includes('/packages'));
const createdCustomer = await record('customers','full_name=eq.'+encodeURIComponent(newCustomerName));
const createdCompany = await record('companies','company_name=eq.'+encodeURIComponent(companyName),'id,owner_user_id');
assert.equal(createdCompany.owner_user_id,createdCustomer.id);
await expectNotFound(await nobody.request('/companies/'+createdCompany.id));
assert.equal((await newCustomer.request('/companies/'+createdCompany.id+'/dashboard')).status,200);
console.log('PASS: customer signup continues to company registration; ownership is saved; pending company stays private.');

const recovery = actor();
const recoveryPath = '/forgot-password?phone=923000000001';
const wrongAnswer = await submit(recovery,recoveryPath,{phone:'03000000001',secretAnswer:'wrong'},'name="secretAnswer"');
assert.ok(wrongAnswer.headers.get('location')?.includes('wrong-answer'));
const correctAnswer = await submit(recovery,recoveryPath,{phone:'03000000001',secretAnswer:'synthetic'},'name="secretAnswer"');
assert.ok(correctAnswer.headers.get('location')?.includes('verified=1'));
const resetPath = recoveryPath+'&verified=1';
const reset = await submit(recovery,resetPath,{phone:'03000000001',newPassword:password},'name="newPassword"');
assert.ok(reset.headers.get('location')?.includes('/login?status=reset'));
await login('03000000001');
console.log('PASS: worker recovery rejects wrong answers and accepts a verified password reset.');
