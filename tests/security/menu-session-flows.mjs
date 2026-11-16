import assert from 'node:assert/strict';

// Existing synthetic fixture only; never run account tests against production.
if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:55434') {
  throw new Error('Synthetic local database required.');
}
const base = 'http://127.0.0.1:3103';
const password = 'Synthetic-Test-Only-2026!';

function actor() {
  const cookies = new Map();
  return {
    cookies,
    async request(path, options = {}) {
      const response = await fetch(new URL(path, base), {
        ...options, redirect: 'manual',
        headers: { Origin: base, Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; '), ...options.headers },
      });
      for (const raw of response.headers.getSetCookie()) {
        const pair = raw.split(';')[0];
        const separator = pair.indexOf('=');
        cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
      }
      return response;
    },
  };
}

async function login(who, role) {
  const path = role === 'owner' ? '/admin/login' : '/login';
  const html = await (await who.request(path)).text();
  const form = (html.match(/<form\b[\s\S]*?<\/form>/g) ?? []).find(value => value.includes('$ACTION_'));
  assert.ok(form, 'Login form rendered');
  const data = new FormData();
  for (const input of form.match(/<input\b[^>]*>/g) ?? []) {
    const name = input.match(/name="([^"]+)"/)?.[1];
    if (name && (input.includes('type="hidden"') || name.startsWith('$ACTION_'))) {
      data.set(name, (input.match(/value="([^"]*)"/)?.[1] ?? '').replaceAll('&amp;', '&'));
    }
  }
  data.set('password', password);
  if (role === 'owner') data.set('role', 'owner');
  else data.set('phone', role === 'worker' ? '03000000001' : '03000000002');
  const response = await who.request(path, { method: 'POST', body: data });
  assert.equal(response.status, 303, 'Login redirects');
  assert.ok(!response.headers.get('location')?.includes('invalid'), 'Synthetic credentials accepted');
}

async function menu(who) {
  const response = await who.request('/api/menu/session');
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('cache-control')?.includes('no-store'));
  return response.json();
}

const guest = actor();
assert.deepEqual(await menu(guest), { professionalLoggedIn: false, customerLoggedIn: false, adminAuthenticated: false });
guest.cookies.set('kamker_admin_session_v2', 'invalid-admin-cookie');
assert.equal((await menu(guest)).adminAuthenticated, false);

const admin = actor();
await login(admin, 'owner');
assert.equal((await menu(admin)).adminAuthenticated, true);
assert.equal((await admin.request('/admin')).status, 200);

for (const role of ['worker', 'customer']) {
  const who = actor();
  await login(who, role);
  const session = await menu(who);
  assert.equal(session[role === 'worker' ? 'professionalLoggedIn' : 'customerLoggedIn'], true);
  assert.equal(session.adminAuthenticated, false);
  const protectedPage = await who.request('/admin/workers');
  assert.equal(protectedPage.status, 307);
  assert.ok(protectedPage.headers.get('location')?.includes('/admin/login'));
  assert.equal((await who.request('/admin/analytics/export')).status, 307);

  // Reproduce a browser carrying both a public-account and a valid admin cookie.
  who.cookies.set('kamker_admin_session_v2', admin.cookies.get('kamker_admin_session_v2'));
  assert.equal((await menu(who)).adminAuthenticated, false);
}
console.log('PASS: guest/invalid session denied; worker/customer menus exclude admin privileges, including mixed cookies; ordinary users cannot open admin pages or export; real admin access remains available.');
