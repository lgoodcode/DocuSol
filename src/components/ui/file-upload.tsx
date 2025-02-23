import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { UploadIcon, Trash2, FileIcon } from "lucide-react";

import { MAX_FILE_SIZE, ACCEPTED_FILE_EXTENSIONS } from "@/constants";
import { formatFileSize } from "@/lib/utils/format-file-size";
import { Button } from "@/components/ui/button";

export const FileUpload = ({
  file,
  accept,
  onChange,
  onRemove,
  disabled,
}: {
  file: File | null;
  accept: string[];
  onChange: (file: File) => void;
  onRemove: (file: File) => void;
  disabled?: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trashRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    const target = e.target as Node;
    const isTrashButton = trashRef.current?.contains(target);

    if (isTrashButton) {
      e.preventDefault();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File is too large. Max size is ${formatFileSize(MAX_FILE_SIZE)}. Your file is ${formatFileSize(file.size)}`,
      );
      return;
    }

    if (!accept.includes(file.type)) {
      setError(
        `${file.type} type is not supported. Supported types are ${accept.join(", ")}`,
      );
      return;
    }

    onChange(file);
  };

  const { getRootProps } = useDropzone({
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    multiple: false,
    noClick: true,
    disabled,
    maxSize: MAX_FILE_SIZE,
    onDrop: (acceptedFiles) => {
      onChange(acceptedFiles[0]);
    },
    onDropRejected: (error) => {
      setError(error[0].errors[0].message);
    },
  });

  useEffect(() => {
    if (file === null && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [file]);

  return (
    <div className="w-full" {...getRootProps()}>
      <AnimatePresence mode="wait">
        {file === null ? (
          <motion.div
            key="upload-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClick}
            className="group/file relative block w-full cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-800"
          >
            <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
              <GridPattern />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload-handle"
              onChange={handleFileUpload}
              className="hidden"
              accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
            />
            <div className="z-20 flex flex-col items-center justify-center p-6 sm:p-8">
              <div className="z-20 mb-4 rounded-full bg-neutral-100 p-3 dark:bg-neutral-900">
                <UploadIcon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
              </div>
              <p className="z-20 text-center font-medium text-neutral-700 dark:text-neutral-300">
                Drop your file here or click to upload
              </p>
              <p className="z-20 mt-1 text-center text-sm text-neutral-500 dark:text-neutral-400">
                Supported formats:{" "}
                {accept
                  .map((type) => type.split("/")[1].toUpperCase())
                  .join(", ")}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file-info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
                  <FileIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {file.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => onRemove(file)}
                disabled={disabled}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center text-sm text-red-500 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex flex-shrink-0 scale-105 flex-wrap items-center justify-center gap-x-px gap-y-px bg-gray-100 dark:bg-neutral-900">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`flex h-10 w-10 flex-shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:bg-neutral-950 dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        }),
      )}
    </div>
  );
}
