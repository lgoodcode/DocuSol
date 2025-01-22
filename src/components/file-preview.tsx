"use client";

import Image from "next/image";

interface PreviewProps {
  file: File | null;
  preview: string | null;
}

export function FilePreview({ file, preview }: PreviewProps) {
  if (!preview || !file) return null;

  return (
    <div className="max-h-[400px] w-full max-w-sm mx-auto overflow-hidden rounded-md border">
      {file.type === "application/pdf" ? (
        <embed
          src={`${preview}#toolbar=0`}
          type="application/pdf"
          className="w-full h-[400px]"
        />
      ) : (
        <div className="relative h-[300px] w-full">
          <Image
            src={preview}
            alt="Document preview"
            className="object-contain"
            fill
            sizes="(max-width: 640px) 100vw, 640px"
          />
        </div>
      )}
    </div>
  );
}
