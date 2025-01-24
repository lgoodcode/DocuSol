"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { IS_MOBILE } from "@/constants";
import { hexToBuffer } from "@/lib/utils";

interface PreviewProps {
  file: File | Blob | null;
  preview: string | null;
}

export function FilePreview({ file, preview }: PreviewProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < 768 || IS_MOBILE
  );

  useEffect(() => {
    const checkMobileWidth = () => {
      setIsMobile(window.innerWidth < 768 || IS_MOBILE);
    };

    checkMobileWidth();

    window.addEventListener("resize", checkMobileWidth);
    return () => window.removeEventListener("resize", checkMobileWidth);
  }, []);

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const img = new window.Image();
      img.src = preview || "";
      img.onload = () => {
        const { naturalWidth, naturalHeight } = img;
        const maxWidth = 384;
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

  if (isMobile && file.type === "application/pdf") {
    return (
      <div className="w-full max-w-sm mx-auto p-4 rounded-md border bg-background dark:bg-muted">
        <div className="text-center space-y-3">
          <p className="font-medium">
            PDF Preview not available on mobile devices
          </p>
          <p className="text-sm text-muted-foreground">
            Please use a desktop browser to preview or click below to open
          </p>
          <a
            href={preview}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 underline underline-offset-4"
          >
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </a>
        </div>
      </div>
    );
  }

  const containerHeight =
    dimensions.height > 0 ? Math.max(dimensions.height + 16, 100) : 300;

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

export const BlobPreview = ({
  hexValue,
  mimeType,
}: {
  hexValue: string;
  mimeType: string;
}) => {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const rawData = hexToBuffer(hexValue);
    const file = new Blob([rawData], { type: mimeType });
    const preview = URL.createObjectURL(file);
    setBlob(file);
    setPreview(preview);
    setUrl(preview);

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [hexValue, mimeType, url]);

  return <FilePreview file={blob} preview={preview} />;
};
