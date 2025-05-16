"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, XCircle } from "lucide-react";

import { ACCEPTED_FILE_TYPES } from "@/constants";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function VerifyContent() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (selectedFile: File) => {
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(selectedFile.type)) {
      setError(`Invalid file type. Please upload a PDF file.`);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleFileRemove = () => {
    setFile(null);
    setError(null);
  };

  const handleVerify = async () => {
    if (!file) {
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);

      console.log("Verifying file:", file.name);

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(err);
      setError("An error occurred during verification.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Verify Document</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Upload a document to verify its integrity and authenticity.
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

            {isProcessing ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center py-2"
              >
                <div className="flex items-center text-lg text-muted-foreground">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Verifying document, please wait...
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
                <FileUpload
                  file={file || null}
                  accept={Object.keys(ACCEPTED_FILE_TYPES)}
                  onChange={handleFileChange}
                  onRemove={handleFileRemove}
                />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {!isProcessing && (
        <div className="mt-4 flex justify-end">
          <Button disabled={!file} onClick={handleVerify}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Verify
          </Button>
        </div>
      )}
    </div>
  );
}
