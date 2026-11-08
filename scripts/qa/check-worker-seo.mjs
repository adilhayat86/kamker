import assert from "node:assert/strict";

const base = process.env.BASE_URL || "http://127.0.0.1:3129";
const publicPaths = ["/", "/about", "/categories", "/contact", "/privacy", "/terms", "/register", "/register/professional", "/register/company", "/send-requirement", "/part-time-workers/karachi"];
const cases = publicPaths.map(path => ({ path, canonical: path }));
cases.push(
  { path: "/register/professional?status=missing&utm_source=google", canonical: "/register/professional" },
  { path: "/professionals?city=Lahore", canonical: "/professionals", noindex: true },
  { path: "/categories/nurses?city=Lahore", canonical: "/categories/nurses", noindex: true },
);

for (const item of cases) {
  const response = await fetch(`${base}${item.path}`);
  assert.equal(response.status, 200, item.path);
  const html = await response.text();
  const canonicalTags = html.match(/<link\b[^>]*rel="canonical"[^>]*>/g) || [];
  assert.equal(canonicalTags.length, 1, `one canonical: ${item.path}`);
  const canonical = new URL(canonicalTags[0].match(/href="([^"]+)"/)[1]);
  assert.equal(canonical.origin, "https://kamker.com", item.path);
  assert.equal(canonical.pathname, item.canonical, item.path);
  assert.equal(canonical.search, "", item.path);
  if (item.noindex) assert.match(html, /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/, item.path);
  if (item.path === "/register/professional") {
    assert.match(html, /<title>Free Worker Registration in Pakistan \| Kamker<\/title>/);
    assert.match(html, /<h1[^>]*>\s*Register as a worker\s*<\/h1>/);
    assert.match(html, /Does registration guarantee work or earnings/);
  }
  if (item.path === "/") {
    assert.match(html, /<h1[^>]*>Find part time workers<\/h1>/);
    assert.match(html, /href="\/register\/professional"[^>]*>[\s\S]*?Register as worker/);
    assert.match(html, /href="\/register"/);
  }
  console.log(`PASS ${item.path}`);
}

const sitemapResponse = await fetch(`${base}/sitemap.xml`);
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.ok(urls.includes("https://kamker.com/register/professional"));
assert.equal(new Set(urls).size, urls.length, "unique sitemap URLs");
assert.doesNotMatch(sitemap, /<lastmod>/, "omit unavailable update timestamps");
for (const value of urls) {
  const url = new URL(value);
  assert.equal(url.origin, "https://kamker.com");
  assert.equal(url.search, "");
  assert.doesNotMatch(url.pathname, /^\/(admin|account|api|login|logout|forgot-password)(\/|$)/);
}
console.log(`PASS single sitemap: ${urls.length} unique public URLs`);

const missing = await fetch(`${base}/seo-check-no-such-page`, { redirect: "manual" });
assert.equal(missing.status, 404);
console.log("PASS genuine missing page stays 404");
