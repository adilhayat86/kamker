// Preload into the loopback-only synthetic test server, never a deployment.
import './media-provider-fixture.mjs';
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const avatar = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" rx="20" fill="#087f5b"/><text x="80" y="95" font-size="42" text-anchor="middle" fill="white">TEST</text></svg>')).jpeg().toBuffer();
if (process.env.KAMKER_PHOTO_FIXTURE_IMAGE_PATH) {
  await writeFile(process.env.KAMKER_PHOTO_FIXTURE_IMAGE_PATH, avatar);
}
const upstream = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(raw);
  if (url.hostname === 'res.cloudinary.com' && url.pathname.startsWith('/kamker-synthetic-local/')) {
    return new Response(avatar, { headers: { 'Content-Type': 'image/jpeg' } });
  }
  return upstream(input, init);
};
