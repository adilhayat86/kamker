import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:3103';
const db = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (db !== 'http://127.0.0.1:55434') throw new Error('Synthetic local database required.');
const password = 'Synthetic-Recovery-Test-2026!';
const newPassword = 'Synthetic-Recovery-Reset-2026!';
const phrase = 'Synthetic quiet river lantern';
const stamp = String(Date.now()).slice(-7);
const phone = `0301${stamp}`;
const workerName = `Synthetic Recovery Journey ${stamp}`;
const service = { Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`, 'Content-Type': 'application/json' };

function actor() {
  const cookies = new Map();
  return { async request(path, options = {}) {
    const response = await fetch(new URL(path, base), { ...options, redirect: 'manual', headers: {
      Origin: base, Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; '), ...options.headers,
    } });
    for (const raw of response.headers.getSetCookie()) {
      const pair = raw.split(';')[0], split = pair.indexOf('=');
      cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    return response;
  } };
}
function form(html, marker = '') {
  const selected = (html.match(/<form\b[\s\S]*?<\/form>/g) ?? []).find(item => item.includes('$ACTION_') && item.includes(marker));
  assert.ok(selected, 'Expected server-action form');
  const data = new FormData();
  for (const input of selected.match(/<input\b[^>]*>/g) ?? []) {
    const name = input.match(/name="([^"]+)"/)?.[1];
    if (name && (input.includes('type="hidden"') || name.startsWith('$ACTION_'))) data.set(name, (input.match(/value="([^"]*)"/)?.[1] ?? '').replaceAll('&amp;', '&'));
  }
  return data;
}
async function submit(who, path, fields, marker = '', prepared) {
  const data = prepared ?? form(await (await who.request(path)).text(), marker);
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return who.request(path, { method: 'POST', body: data });
}
function redirected(response, destination) {
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), destination);
}

// Each run creates its own named disposable account in the isolated fixture.
const guest = actor();
const signedOut = await guest.request('/account/recovery');
const signedOutHtml = await signedOut.text();
assert.ok(signedOut.status === 307 || (signedOutHtml.includes('NEXT_REDIRECT') && signedOutHtml.includes('/login?next=/account/recovery')));
assert.ok(!signedOutHtml.includes('name="recoveryPhrase"'));

const worker = actor();
redirected(await submit(worker, '/register/professional', {
  fullName: workerName, phone, city: 'Synthetic Test City', category: 'Synthetic Test Service', gender: 'Male', age: '25',
  availabilityTime: 'full_time', availabilityDays: 'seven_days', rate: '500', password,
}), '/account/photo?status=registered');
const photoPage = await (await worker.request('/account/photo?status=registered')).text();
assert.ok(photoPage.includes('/account/recovery?status=registered'));
assert.ok((await (await worker.request('/account')).text()).includes('id="recovery-reminder-title"'));
assert.ok((await (await worker.request('/account/recovery?status=photo-saved')).text()).includes('Photo uploaded and profile saved successfully'));

const recoveryForm = form(await (await worker.request('/account/recovery')).text());
redirected(await submit(guest, '/account/recovery', { recoveryPhrase: phrase, confirmRecoveryPhrase: phrase, currentPassword: password }, '', recoveryForm), '/login?next=/account/recovery');
const customer = actor();
assert.equal((await submit(customer, '/login', { phone: '03000000002', password: 'Synthetic-Test-Only-2026!' })).status, 303);
redirected(await submit(customer, '/account/recovery', { recoveryPhrase: phrase, confirmRecoveryPhrase: phrase, currentPassword: password }, '', recoveryForm), '/login?next=/account/recovery');
for (const [fields, status] of [
  [{ recoveryPhrase: 'blue', confirmRecoveryPhrase: 'blue', currentPassword: password }, 'phrase-length'],
  [{ recoveryPhrase: phrase, confirmRecoveryPhrase: 'different synthetic phrase', currentPassword: password }, 'phrase-mismatch'],
  [{ recoveryPhrase: password, confirmRecoveryPhrase: password, currentPassword: password }, 'phrase-password'],
  [{ recoveryPhrase: phrase, confirmRecoveryPhrase: phrase, currentPassword: 'incorrect' }, 'password-invalid'],
]) redirected(await submit(worker, '/account/recovery', fields), `/account/recovery?status=${status}`);
assert.ok((await (await worker.request('/account')).text()).includes('id="recovery-reminder-title"'));

// Supplied target IDs are ignored; only the authenticated worker can be changed.
redirected(await submit(worker, '/account/recovery', { recoveryPhrase: phrase, confirmRecoveryPhrase: phrase.toUpperCase(), currentPassword: password, professionalId: '00000000-0000-4000-8000-000000000099' }), '/account?status=recovery-saved');
const account = await (await worker.request('/account?status=recovery-saved')).text();
assert.ok(!account.includes('id="recovery-reminder-title"'));
assert.ok(account.includes('Password recovery saved'));
assert.ok(!account.includes(phrase) && !account.includes('scrypt:'));
const edit = await (await worker.request('/account/edit')).text();
assert.ok(edit.includes('/account/recovery') && !edit.includes('name="secretAnswer"'));
// The old profile form can no longer overwrite private recovery credentials.
redirected(await submit(worker, '/account/edit', {
  fullName: workerName, phone, city: 'Synthetic Test City', category: 'Synthetic Test Service', gender: 'Male', age: '25',
  availabilityTime: 'full_time', availabilityDays: 'seven_days', rate: '500', yearsExperience: '0',
  secretQuestion: 'Injected question', secretAnswer: 'injected recovery answer',
}, 'name="fullName"'), '/account?status=updated');

const reset = actor();
const start = await submit(reset, '/forgot-password', { phone });
assert.equal(start.status, 303);
const questionPath = start.headers.get('location');
const questionPage = await (await reset.request(questionPath)).text();
assert.ok(questionPage.includes('What is your private recovery phrase?') && !questionPage.includes(phrase));
const wrong = await submit(reset, questionPath, { phone, secretAnswer: 'incorrect phrase' });
assert.ok(wrong.headers.get('location')?.includes('wrong-answer'));
const verified = await submit(reset, questionPath, { phone, secretAnswer: phrase.toUpperCase() });
assert.ok(verified.headers.get('location')?.includes('verified=1'));
redirected(await submit(reset, verified.headers.get('location'), { phone, newPassword }), '/login?status=reset');
const relogin = actor();
assert.ok((await submit(relogin, '/login', { phone, password })).headers.get('location')?.includes('invalid'));
redirected(await submit(relogin, '/login', { phone, password: newPassword }), '/account');

// Older question labels and the existing answer-hash format remain usable.
const legacy = await fetch(`${db}/rest/v1/professionals?full_name=eq.${encodeURIComponent(workerName)}`, {
  method: 'PATCH', headers: service, body: JSON.stringify({ secret_question: 'What is your first school name?' }),
});
assert.ok(legacy.ok);
const legacyReset = actor();
const legacyStart = await submit(legacyReset, '/forgot-password', { phone });
const legacyPath = legacyStart.headers.get('location');
assert.ok((await (await legacyReset.request(legacyPath)).text()).includes('What is your first school name?'));
assert.ok((await submit(legacyReset, legacyPath, { phone, secretAnswer: phrase })).headers.get('location')?.includes('verified=1'));
console.log('PASS: short registration and photo handoff, missing-recovery reminder, guest/customer denial, setup validation and password reauthentication, own-account-only save, private HTML, old-profile-form bypass prevention, reminder removal, complete reset, new-password login and legacy-question compatibility. Synthetic account retained for local visual checks only.');
