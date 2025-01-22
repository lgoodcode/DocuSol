"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface PreviewProps {
  file: File | null;
  preview: string | null;
}

export function FilePreview({ file, preview }: PreviewProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const img = new window.Image();
      img.src = preview || "";
      img.onload = () => {
        const { naturalWidth, naturalHeight } = img;
        const maxWidth = 384; // max-w-sm = 384px
        const maxHeight = 300;

        let width = naturalWidth;
        let height = naturalHeight;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }

        if (height > maxHeight) {
          const ratio = maxHeight / height;
          height = maxHeight;
          width = width * ratio;
        }

        setDimensions({
          width: Math.round(width),
          height: Math.round(height),
        });
      };
    }
  }, [file, preview]);

  if (!preview || !file) return null;

  const containerHeight =
    dimensions.height > 0 ? Math.max(dimensions.height + 16, 50) : 300;

  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-sm overflow-hidden rounded-md border">
        {file.type === "application/pdf" ? (
          <embed
            src={`${preview}#toolbar=0`}
            type="application/pdf"
            className="w-full h-[400px]"
          />
        ) : (
          <div
            className="flex items-center justify-center p-2 mx-auto"
            style={{ height: `${containerHeight}px` }}
          >
            {dimensions.width > 0 && (
              <Image
                src={preview}
                alt="Document preview"
                width={dimensions.width}
                height={dimensions.height}
                className="object-contain"
                quality={100}
                priority
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
