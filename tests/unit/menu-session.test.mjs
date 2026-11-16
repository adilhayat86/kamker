import assert from "node:assert/strict";
import { test } from "node:test";
import { canShowAdminMenu, guestMenuSession, menuSessionFromResponse } from "../../src/lib/menu-session.ts";

test("ordinary accounts never receive admin menu privileges, including a leftover admin session", () => {
  for (const role of ["professionalLoggedIn", "customerLoggedIn"]) {
    const input = { ...guestMenuSession, [role]: true, adminAuthenticated: true };
    const session = menuSessionFromResponse(input);
    assert.equal(session[role], true);
    assert.equal(session.adminAuthenticated, false);
    for (const pathname of ["/", "/account", "/admin", "/admin/workers"]) {
      assert.equal(canShowAdminMenu(pathname, input), false);
      assert.equal(canShowAdminMenu(pathname, session), false);
    }
  }
});

test("authenticated admins see admin navigation only inside the admin area", () => {
  const session = menuSessionFromResponse({ adminAuthenticated: true });
  for (const pathname of ["/admin", "/admin/workers", "/admin/analytics"]) {
    assert.equal(canShowAdminMenu(pathname, session), true);
  }
  for (const pathname of ["/", "/account", "/categories", "/administrator", "/admin-other"]) {
    assert.equal(canShowAdminMenu(pathname, session), false);
  }
});

test("missing, malformed and non-boolean session responses fail closed", () => {
  for (const value of [null, undefined, false, "admin", {}, [], { adminAuthenticated: "true" }, { adminAuthenticated: 1 }]) {
    const session = menuSessionFromResponse(value);
    assert.deepEqual(session, guestMenuSession);
    assert.equal(canShowAdminMenu("/admin", session), false);
  }
});

test("signed-out users cannot see admin navigation even inside admin routes", () => {
  assert.equal(canShowAdminMenu("/admin", guestMenuSession), false);
  assert.equal(canShowAdminMenu("/admin/system", guestMenuSession), false);
});
