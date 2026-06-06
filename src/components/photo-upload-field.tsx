"use client";

import { useRef, useState } from "react";

const MAX_DIRECT_UPLOAD_BYTES = 20 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type PhotoUploadFieldProps = {
  disabled?: boolean;
};

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function setInputError(input: HTMLInputElement, message = "") {
  input.setCustomValidity(message);
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

  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);

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

export function PhotoUploadField({ disabled = false }: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState(
    "Phone photos are accepted. Large images will be compressed before upload.",
  );

  async function handleChange() {
    const input = inputRef.current;
    const file = input?.files?.[0];

    if (!input || !file) {
      setMessage(
        "Phone photos are accepted. Large images will be compressed before upload.",
      );
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

    setMessage(`Compressing ${formatSize(file.size)} phone photo...`);

    try {
      const compressed = await compressImage(file);
      const transfer = new DataTransfer();
      transfer.items.add(compressed);
      input.files = transfer.files;
      setMessage(
        compressed.size < file.size
          ? `Compressed to ${formatSize(compressed.size)} and ready to upload.`
          : `Selected ${file.name} (${formatSize(file.size)}).`,
      );
    } catch {
      setMessage(
        `Selected ${file.name} (${formatSize(file.size)}). It will upload if under 8MB.`,
      );
    }
  }

  return (
    <label className="grid gap-2 sm:col-span-2">
      <span className="text-sm font-medium">Profile photo</span>
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
      <span className="text-xs text-muted-foreground">
        If registration needs correction, keep this page open so the selected photo stays attached.
      </span>
    </label>
  );
}
