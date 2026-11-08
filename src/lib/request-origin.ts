export function hasSameOrigin(request: Request) {
  const value = request.headers.get("origin");
  if (!value) return false;
  try {
    const origin = new URL(value);
    const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim()
      || request.headers.get("host") || new URL(request.url).host;
    return ["http:", "https:"].includes(origin.protocol) && origin.host === host;
  } catch { return false; }
}
