import "server-only";
import { supabase } from "@/lib/supabase";

export function proofPath(reference: string) {
  let path: string | null = null;
  if (reference.startsWith("/api/proofs?")) {
    path = new URL(reference, "https://kamker.com").searchParams.get("path");
  } else {
    try {
      const url = new URL(reference);
      if (url.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin) return null;
      const prefix = "/storage/v1/object/public/proof-images/";
      if (url.pathname.startsWith(prefix)) path = decodeURIComponent(url.pathname.slice(prefix.length));
    } catch { return null; }
  }
  return path && /^[a-zA-Z0-9_/-]+\.[a-zA-Z0-9]+$/.test(path) && !path.includes("..") ? path : null;
}

export function privateProofUrl(pathOrReference: string) {
  const path = proofPath(pathOrReference) ?? pathOrReference;
  return `/api/proofs?path=${encodeURIComponent(path)}`;
}

export async function signedProofUrl(reference: string, seconds = 60) {
  const path = proofPath(reference);
  if (!supabase || !path) throw new Error("Invalid private proof reference");
  const { data, error } = await supabase.storage.from("proof-images").createSignedUrl(path, seconds);
  if (error || !data?.signedUrl) throw new Error("Private proof is unavailable");
  return data.signedUrl;
}
