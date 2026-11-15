"use client";

import { usePhotoUpload } from "@/components/photo-form";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

const MAX_DIRECT_UPLOAD_BYTES = 10 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const DEFAULT_MESSAGE =
  "Choose a clear photo. You can skip this step and add a photo later.";

type UploadState = "idle" | "preparing" | "uploading" | "attached" | "failed";

type PhotoUploadFieldProps = {
  disabled?: boolean;
  label?: string;
  helpText?: string;
  uploadFolder?: "professional-photos" | "company-staff";
  uploadTags?: string[];
  companyId?: string;
  initialPhotoUrl?: string;
};

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function setInputError(input: HTMLInputElement, message = "") {
  try {
    input.setCustomValidity(message);
  } catch {
    // Some older mobile webviews have partial constraint-validation support.
  }
}

function clearSelectedFile(input: HTMLInputElement) {
  try {
    input.value = "";
  } catch {
    // Some older mobile webviews do not allow programmatic file clearing.
  }
}

function imageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
  type = "image/jpeg",
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

async function compressImage(file: File) {
  if (
    typeof window === "undefined" ||
    typeof FileReader === "undefined" ||
    typeof Image === "undefined" ||
    typeof document === "undefined" ||
    typeof document.createElement !== "function"
  ) {
    return file;
  }

  const reader = new FileReader();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = await imageFromDataUrl(dataUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context || typeof canvas.toBlob !== "function") {
    return file;
  }

  for (const maxDimension of [MAX_IMAGE_DIMENSION, 1280, 1024, 800]) {
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.82, 0.72, 0.62, 0.54, 0.44]) {
      const blob = await canvasToBlob(canvas, quality);

      if (blob && blob.size <= TARGET_UPLOAD_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }
    }
  }

  return file;
}

async function uploadPhotoToCloudinary(
  file: File,
  folder: PhotoUploadFieldProps["uploadFolder"],
  tags: string[],
  companyId?: string,
) {
  const signResponse = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder,
      companyId,
      tags,
    }),
  });

  if (!signResponse.ok) {
    throw new Error(`setup-${signResponse.status}`);
  }

  const signed = (await signResponse.json()) as {
    cloudName: string;
    apiKey: string;
    folder: string;
    publicId: string;
    timestamp: string;
    tags: string;
    signature: string;
    intentId: string;
    format: string;
    allowedFormats: string;
    overwrite: string;
  };
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signed.apiKey);
  body.append("folder", signed.folder);
  body.append("public_id", signed.publicId);
  body.append("timestamp", signed.timestamp);
  body.append("signature", signed.signature);
  body.append("format", signed.format);
  body.append("allowed_formats", signed.allowedFormats);
  body.append("overwrite", signed.overwrite);

  if (signed.tags) {
    body.append("tags", signed.tags);
  }

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    {
      method: "POST",
      body,
    },
  );

  } catch {
    void fetch("/api/cloudinary/failure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: signed.intentId }) }).catch(() => {});
    throw new Error("upload-network");
  }
  if (!uploadResponse.ok) {
    void fetch("/api/cloudinary/failure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: signed.intentId }) }).catch(() => {});
    throw new Error(`upload-${uploadResponse.status}`);
  }

  const result = (await uploadResponse.json()) as { secure_url?: string };

  if (!result.secure_url) {
    throw new Error("upload-no-url");
  }

  const preview = new URL(result.secure_url);
  if (preview.origin !== "https://res.cloudinary.com" ||
      !preview.pathname.startsWith(`/${signed.cloudName}/image/upload/`)) {
    throw new Error("upload-invalid-url");
  }

  return { intentId: signed.intentId, previewUrl: preview.href };
}

export function PhotoUploadField({
  disabled = false,
  label = "Profile photo",
  helpText = "Your existing photo stays unchanged until your profile is saved.",
  uploadFolder = "professional-photos",
  uploadTags = ["professional-photo"],
  companyId,
  initialPhotoUrl = "",
}: PhotoUploadFieldProps) {
  const { setBusy, setHasPendingPhoto } = usePhotoUpload();
  const { pending } = useFormStatus();
  const defaultMessage = initialPhotoUrl
    ? "Your current photo is saved. Choose another photo only if you want to replace it."
    : DEFAULT_MESSAGE;
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoIntentId, setPhotoIntentId] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [previewUrl, setPreviewUrl] = useState(initialPhotoUrl);
  const [fileName, setFileName] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");

  async function handleChange() {
    const input = inputRef.current;
    const file = input?.files?.[0];
    setHasPendingPhoto(false);

    if (!input || !file) {
      setMessage(defaultMessage);
      setPhotoIntentId("");
      setPreviewUrl(initialPhotoUrl);
      setFileName("");
      setUploadState("idle");
      if (input) {
        setInputError(input);
      }
      return;
    }

    const isHeic = ["image/heic", "image/heif"].includes(file.type) || /\.hei[cf]$/i.test(file.name);
    if (!ACCEPTED_TYPES.includes(file.type) && !isHeic) {
      clearSelectedFile(input);
      setInputError(input);
      setMessage(
        "This file type is not supported, so it was removed. Continue without photo or choose a JPEG, PNG, WebP or HEIC/HEIF image.",
      );
      setPhotoIntentId("");
      setFileName(file.name);
      setUploadState("failed");
      setPreviewUrl(initialPhotoUrl);
      return;
    }

    setInputError(input);
    setPhotoIntentId("");
    setPreviewUrl(initialPhotoUrl);
    setFileName(file.name);
    setUploadState("preparing");
    setBusy(true);

    try {
      if (!isHeic) setPreviewUrl(await fileToDataUrl(file));
    } catch {
      setPreviewUrl("");
    }

    setMessage(`Preparing ${formatSize(file.size)} photo...`);
    setInputError(input, "Please wait for the photo upload to finish.");
    setUploadState("preparing");

    let prepared = file;

    try {
      if (!isHeic && file.size > TARGET_UPLOAD_BYTES) {
        try {
          prepared = await compressImage(file);
        } catch {
          prepared = file;
          setMessage("Compression skipped. Uploading original photo...");
        }
      }

      if (prepared.size > MAX_DIRECT_UPLOAD_BYTES) throw new Error("Photo is above the final 10MB limit.");
      setMessage(`Uploading photo (${formatSize(prepared.size)})...`);
      setUploadState("uploading");
      const uploaded = await uploadPhotoToCloudinary(
        prepared,
        uploadFolder,
        uploadTags,
        companyId,
      );
      setPhotoIntentId(uploaded.intentId);
      setPreviewUrl(uploaded.previewUrl);
      setHasPendingPhoto(true);
      setInputError(input);
      setUploadState("attached");
      setMessage("Photo uploaded. Save to attach it to your profile.");
    } catch (error) {
      clearSelectedFile(input);
      setPhotoIntentId("");
      setPreviewUrl(initialPhotoUrl);
      setUploadState("failed");
      setInputError(input);
      const reason =
        error instanceof Error && error.message.startsWith("setup-")
          ? "Photo uploads are temporarily unavailable."
          : error instanceof Error && error.message.startsWith("upload-")
            ? "This photo could not be uploaded. Try a JPEG or PNG photo."
            : error instanceof Error && error.message.includes("10MB") ? error.message : "Photo upload failed.";
      setMessage(`${reason} Your existing photo is unchanged. Choose the photo again to retry.`);
    } finally {
      setBusy(false);
    }
  }

  function clearPhoto() {
    const input = inputRef.current;

    if (input) {
      clearSelectedFile(input);
      setInputError(input);
    }

    setPhotoIntentId("");
    setHasPendingPhoto(false);
    setFileName("");
    setUploadState("idle");
    setPreviewUrl(initialPhotoUrl);
    setMessage(defaultMessage);
  }

  const isBusy = uploadState === "preparing" || uploadState === "uploading";
  const statusLabel =
    pending && photoIntentId
      ? "Saving photo..."
      : uploadState === "attached"
      ? "Photo uploaded"
      : uploadState === "failed"
        ? "Photo not uploaded"
        : isBusy
          ? uploadState === "preparing" ? "Preparing photo..." : "Uploading photo..."
          : initialPhotoUrl ? "Current profile photo" : "Photo selected";
  const statusClass =
    uploadState === "attached"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : uploadState === "failed"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-sky-200 bg-sky-50 text-sky-950";

  return (
    <div className="grid gap-2 sm:col-span-2">
      <label htmlFor={`${uploadFolder}-photo`} className="text-sm font-medium">
        {label}
      </label>
      {/* Submit only the checked upload intent, not the already-uploaded file. */}
      <input
        id={`${uploadFolder}-photo`}
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        disabled={disabled || isBusy || pending}
        onChange={handleChange}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      />
      <input type="hidden" name="photoIntentId" value={photoIntentId} />
      {previewUrl || fileName ? (
        <div role="status" aria-live="polite" aria-atomic="true" className={`rounded-lg border p-3 ${statusClass}`}>
          <div className="flex items-center gap-3">
            {previewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={fileName ? "Selected profile preview" : "Current profile photo"}
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              </>
            ) : <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-white/70 text-2xl">{isBusy ? "…" : "!"}</span>}
            <div className="min-w-0">
              <p className="text-sm font-semibold">{statusLabel}</p>
              <p className="truncate text-xs opacity-80">{fileName || "Saved profile photo"}</p>
            </div>
          </div>
          <p className="mt-2 text-sm font-medium">{pending && photoIntentId ? "Saving your photo to your profile..." : message}</p>
          {!isBusy && fileName ? (
            <button
              type="button"
              disabled={pending}
              onClick={clearPhoto}
              className="mt-3 min-h-11 w-full rounded-md border border-current bg-white/80 px-3 py-2 text-sm font-semibold sm:w-auto"
            >
              Choose another photo
            </button>
          ) : null}
        </div>
      ) : null}
      {!previewUrl && !fileName ? <span role="status" aria-live="polite" className="text-sm text-muted-foreground">{message}</span> : null}
      {helpText ? <span className="text-xs text-muted-foreground">{helpText}</span> : null}
    </div>
  );
}
