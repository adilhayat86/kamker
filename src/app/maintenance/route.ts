export const dynamic = "force-dynamic";

const message = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Brief maintenance | Kamker</title></head><body style="margin:0;background:#f5f8fb;font-family:system-ui,sans-serif;color:#102c45"><main style="max-width:32rem;margin:12vh auto;padding:2rem;background:white;border-radius:1rem"><h1>We’ll be back shortly</h1><p>Kamker is briefly unavailable while we improve account security. Please try again in a few minutes.</p><p>Your account is being kept safe. For help, email <a href="mailto:adilhayatkamker@gmail.com">adilhayatkamker@gmail.com</a>.</p></main></body></html>`;

export function GET() {
  return new Response(message, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, max-age=0", "Retry-After": "120" },
  });
}

export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
