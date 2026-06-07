"use client";

import { useEffect, useRef, useState } from "react";

const MAX_DIRECT_UPLOAD_BYTES = 10 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MESSAGE =
  "Phone photos are accepted. If photo upload causes trouble, register without photo first and add it later.";

type PhotoUploadFieldProps = {
  disabled?: boolean;
  label?: string;
  helpText?: string;
  uploadFolder?: "professional-photos" | "company-staff";
  uploadTags?: string[];
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
) {
  const signResponse = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder,
      tags,
    }),
  });

  if (!signResponse.ok) {
    throw new Error("cloudinary-sign-error");
  }

  const signed = (await signResponse.json()) as {
    cloudName: string;
    apiKey: string;
    folder: string;
    publicId: string;
    timestamp: string;
    tags: string;
    signature: string;
  };
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signed.apiKey);
  body.append("folder", signed.folder);
  body.append("public_id", signed.publicId);
  body.append("timestamp", signed.timestamp);
  body.append("signature", signed.signature);

  if (signed.tags) {
    body.append("tags", signed.tags);
  }

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    {
      method: "POST",
      body,
    },
  );

  if (!uploadResponse.ok) {
    throw new Error("cloudinary-upload-error");
  }

  const result = (await uploadResponse.json()) as { secure_url?: string };

  if (!result.secure_url) {
    throw new Error("cloudinary-upload-error");
  }

  return result.secure_url;
}

export function PhotoUploadField({
  disabled = false,
  label = "Profile photo",
  helpText = "If registration needs correction, keep this page open so the selected photo stays attached.",
  uploadFolder = "professional-photos",
  uploadTags = ["professional-photo"],
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function replacePreview(url: string) {
    setPreviewUrl((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }

      return url;
    });
  }

  async function handleChange() {
    const input = inputRef.current;
    const file = input?.files?.[0];

    if (!input || !file) {
      setMessage(DEFAULT_MESSAGE);
      setUploadedUrl("");
      setFileName("");
      if (input) {
        setInputError(input);
      }
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      const error = "Please choose a jpg, png, or webp photo.";
      setInputError(input, error);
      setMessage(error);
      setUploadedUrl("");
      setFileName("");
      replacePreview("");
      return;
    }

    setInputError(input);
    setUploadedUrl("");
    setFileName(file.name);
    replacePreview(URL.createObjectURL(file));

    if (file.size > MAX_DIRECT_UPLOAD_BYTES) {
      setMessage(
        `This photo is ${formatSize(file.size)}. Please choose one under 10MB.`,
      );
      setInputError(input, "Please choose a photo under 10MB.");
      setFileName("");
      replacePreview("");
      return;
    }

    setMessage(`Preparing ${formatSize(file.size)} photo...`);
    setInputError(input, "Please wait for the photo upload to finish.");

    try {
      const prepared =
        file.size > TARGET_UPLOAD_BYTES ? await compressImage(file) : file;
      setMessage(`Uploading photo (${formatSize(prepared.size)})...`);
      const publicUrl = await uploadPhotoToCloudinary(
        prepared,
        uploadFolder,
        uploadTags,
      );
      setUploadedUrl(publicUrl);
      replacePreview(publicUrl);
      clearSelectedFile(input);
      setInputError(input);
      setMessage("Photo attached. Continue registration.");
    } catch {
      clearSelectedFile(input);
      setUploadedUrl("");
      setFileName("");
      replacePreview("");
      setInputError(input);
      setMessage("Photo upload failed. You can submit without photo and add it later.");
    }
  }

  return (
    <label className="grid gap-2 sm:col-span-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        ref={inputRef}
        name="photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={handleChange}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      />
      <input type="hidden" name="profilePhotoUrl" value={uploadedUrl} />
      {previewUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Selected profile preview"
            className="size-16 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sky-950">
              {fileName || "Photo attached"}
            </p>
            <p className="text-xs text-sky-800">
              Saved for this registration.
            </p>
          </div>
        </div>
      ) : null}
      <span className="text-xs text-muted-foreground">{message}</span>
      {helpText ? <span className="text-xs text-muted-foreground">{helpText}</span> : null}
    </label>
  );
}
