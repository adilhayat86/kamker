import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getCloudinaryUploadSignature } from "@/lib/cloudinary";

const allowedFolders = new Set([
  "professional-photos",
  "company-staff",
  "company-logos",
  "company-gallery",
]);

export async function POST(request: Request) {
  let payload: { folder?: string; tags?: string[] } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const folder = payload.folder?.trim();

  if (!folder || !allowedFolders.has(folder)) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  const signature = getCloudinaryUploadSignature({
    folder,
    publicId: randomUUID(),
    tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 5) : [],
  });

  if (!signature) {
    return NextResponse.json(
      { error: "Cloudinary is not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json(signature);
}
