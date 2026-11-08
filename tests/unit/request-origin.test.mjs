import test from 'node:test';
import assert from 'node:assert/strict';
import { hasSameOrigin } from '../../src/lib/request-origin.ts';

test('uses the public host when a trusted proxy changes the internal URL', () => {
  assert.equal(hasSameOrigin(new Request('http://localhost:3100/api/upload', {headers:{origin:'https://kamker.com',host:'kamker.com'}})),true);
  assert.equal(hasSameOrigin(new Request('http://internal/api/upload', {headers:{origin:'https://kamker.com','x-forwarded-host':'kamker.com'}})),true);
});
test('rejects absent, malformed, cross-site and wrong-port origins', () => {
  for (const origin of ['', 'null','not a URL','https://attacker.invalid','http://kamker.com:8080']) {
    assert.equal(hasSameOrigin(new Request('https://kamker.com/api/upload',{headers:{origin,host:'kamker.com'}})),false);
  }
});
