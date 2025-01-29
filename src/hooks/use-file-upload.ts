"use client";

import { useState, useEffect, useRef } from "react";

interface UseFileUploadProps {
  preview?: boolean;
}

export function useFileUpload({ preview = false }: UseFileUploadProps = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const selectedFile = e.target.files?.[0] || null;

    // Clean up previous preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);

    if (selectedFile && preview) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the input value
    }
    setFile(null);
    setPreviewUrl(null);
  };

  useEffect(() => {
    // Clean up the preview URL when file changes or component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    file,
    previewUrl,
    handleFileChange,
    clearFile,
    fileInputRef,
  };
}
