"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { IS_MOBILE } from "@/constants";
import { ExternalLink } from "lucide-react";
import { hexToBuffer } from "@/lib/utils";

interface PreviewProps {
  file?: File | Blob | null;
}

export function FilePreview({ file }: PreviewProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== undefined ? window.innerWidth < 768 || IS_MOBILE : false,
  );

  useEffect(() => {
    if (file) {
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  }, [file]);

  useEffect(() => {
    const checkMobileWidth = () => {
      if (typeof window !== undefined) {
        setIsMobile(window.innerWidth < 768 || IS_MOBILE);
      }
    };

    checkMobileWidth();

    window.addEventListener("resize", checkMobileWidth);
    return () => window.removeEventListener("resize", checkMobileWidth);
  }, []);

  useEffect(() => {
    if (file && file.type?.startsWith("image/")) {
      const img = new window.Image();
      img.src = previewUrl || "";
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
  }, [file, previewUrl]);

  if (!file || !previewUrl) return null;

  if (isMobile && file.type === "application/pdf") {
    return (
      <div className="mx-auto w-full max-w-sm rounded-md border bg-background p-4 dark:bg-muted">
        <div className="space-y-3 text-center">
          <p className="font-medium">
            PDF Preview is currently not yet available on mobile devices
          </p>
          <p className="text-sm text-muted-foreground">
            Please use a desktop browser to preview or click below to open
          </p>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            View in new tab
            <ExternalLink className="mr-1 h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  const containerHeight =
    dimensions.height > 0 ? Math.max(dimensions.height + 16, 100) : 300;

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <div className="w-full max-w-sm overflow-hidden rounded-md border">
        {file.type === "application/pdf" ? (
          <embed
            src={`${previewUrl}#toolbar=0`}
            type="application/pdf"
            className="h-[400px] w-full"
          />
        ) : (
          <div
            className="mx-auto flex items-center justify-center p-2"
            style={{ height: `${containerHeight}px` }}
          >
            {dimensions.width > 0 && (
              <Image
                src={previewUrl}
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

      <a
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4 hover:text-primary/80"
      >
        View in new tab
        <ExternalLink className="mr-1 h-4 w-4" />
      </a>
    </div>
  );
}

export const BlobPreview = ({ hexValue }: { hexValue: string }) => {
  const rawData = hexToBuffer(hexValue);
  const file = new Blob([rawData], { type: "application/pdf" });
  return <FilePreview file={file} />;
};
