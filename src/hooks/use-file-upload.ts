"use client";

import { useState, useEffect, useRef } from "react";

export function useFileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    // Clean up the preview URL when file changes or component unmounts
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const selectedFile = e.target.files?.[0] || null;

    // Clean up previous preview
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selectedFile);

    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    } else {
      setPreview(null);
    }
  };

  const clearFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the input value
    }
    setFile(null);
    setPreview(null);
  };

  return { file, preview, handleFileChange, clearFile, fileInputRef };
}
