"use client";

import { useRef, useState } from "react";

const MAX_DIRECT_UPLOAD_BYTES = 20 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MESSAGE =
  "Phone photos are accepted. If photo upload causes trouble, register without photo first and add it later.";

type PhotoUploadFieldProps = {
  disabled?: boolean;
  label?: string;
  helpText?: string;
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
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.width, image.height),
  );
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context || typeof canvas.toBlob !== "function") {
    return file;
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  for (const quality of [0.82, 0.72, 0.62, 0.54]) {
    const blob = await canvasToBlob(canvas, quality);

    if (blob && blob.size < file.size) {
      return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }
  }

  return file;
}

export function PhotoUploadField({
  disabled = false,
  label = "Profile photo",
  helpText = "If registration needs correction, keep this page open so the selected photo stays attached.",
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  async function handleChange() {
    const input = inputRef.current;
    const file = input?.files?.[0];

    if (!input || !file) {
      setMessage(DEFAULT_MESSAGE);
      if (input) {
        setInputError(input);
      }
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      const error = "Please choose a jpg, png, or webp photo.";
      setInputError(input, error);
      setMessage(error);
      return;
    }

    setInputError(input);

    if (file.size > MAX_DIRECT_UPLOAD_BYTES) {
      setMessage(
        `This photo is ${formatSize(file.size)}. Please choose one under 20MB.`,
      );
      input.value = "";
      setInputError(input);
      return;
    }

    if (file.size <= TARGET_UPLOAD_BYTES) {
      setMessage(`Selected ${file.name} (${formatSize(file.size)}).`);
      return;
    }

    setMessage(`Preparing ${formatSize(file.size)} phone photo...`);

    try {
      const compressed = await compressImage(file);

      if (compressed !== file && typeof DataTransfer !== "undefined") {
        const transfer = new DataTransfer();
        transfer.items.add(compressed);
        input.files = transfer.files;
      }

      setMessage(
        compressed.size < file.size
          ? `Prepared photo (${formatSize(compressed.size)}). If it fails, register without photo and add it later.`
          : `Selected ${file.name} (${formatSize(file.size)}).`,
      );
    } catch {
      setMessage(
        `Selected ${file.name} (${formatSize(file.size)}). If it fails, register without photo and add it later.`,
      );
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
      <span className="text-xs text-muted-foreground">{message}</span>
      {helpText ? <span className="text-xs text-muted-foreground">{helpText}</span> : null}
    </label>
  );
}
