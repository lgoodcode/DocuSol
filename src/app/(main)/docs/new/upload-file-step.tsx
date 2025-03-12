"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { captureException } from "@sentry/nextjs";
import { Loader2, XCircle } from "lucide-react";

import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/constants";
import { formatFileSize } from "@/lib/utils/format-file-size";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useUploadDocument } from "./utils";

export function UploadFileStep({
  onStepComplete,
}: {
  onStepComplete: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [documentName, setDocumentName] = useState<string>("");
  const uploadDocument = useUploadDocument();

  const handleFileChange = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `The file is too large. Please try a smaller file. (Max file size: ${formatFileSize(MAX_FILE_SIZE)})`,
      );
      return;
    }

    if (file.type !== "application/pdf") {
      setError(`Invalid file type. Please upload a PDF file.`);
      return;
    }

    setFile(file);
  };

  const handleFileRemove = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    try {
      setError(null);
      setIsUploading(true);
      await uploadDocument(documentName, file);
      onStepComplete();
    } catch (err) {
      const error = err as Error;
      if (error.message === "The resource already exists") {
        setError("A document with this name already exists");
      } else {
        console.error(err);
        captureException(err as Error);
        setError("An error occurred while uploading the document");
      }
    } finally {
      setIsUploading(false); // Only set false here so step complete transition is visible
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Upload Document</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Upload a document to be signed with DocuSol.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="space-y-6 pt-6">
            {/* Error response message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="flex items-center gap-2 text-sm text-destructive md:text-base">
                    <XCircle className="h-4 w-4" />
                    {error}
                  </p>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {isUploading ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center py-2"
                >
                  <div className="flex items-center text-lg text-muted-foreground">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Uploading document, please wait...
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid w-full gap-6"
                >
                  <div className="flex flex-col gap-2">
                    <Label className="mt-0">Document Name</Label>
                    <Input
                      type="text"
                      placeholder="Document name"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                    />
                  </div>

                  <FileUpload
                    file={file}
                    accept={Object.keys(ACCEPTED_FILE_TYPES)}
                    onChange={handleFileChange}
                    onRemove={handleFileRemove}
                  />

                  <div className="flex justify-end">
                    <Button
                      disabled={!file || !documentName}
                      onClick={handleUpload}
                    >
                      Upload
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
