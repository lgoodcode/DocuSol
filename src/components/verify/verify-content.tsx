"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, XCircle, CheckCircle2 } from "lucide-react";

import { ACCEPTED_FILE_TYPES } from "@/constants";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PDFMetadata } from "@/lib/stamp/pdf-metadata";
import type { DocumentStamp } from "@/lib/types/stamp";

import { handleVerifyDocument, verificationErrors } from "./utils";

export function VerifyContent() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    details?: DocumentStamp;
  } | null>(null);

  const handleFileChange = async (selectedFile: File) => {
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(selectedFile.type)) {
      setError(`Invalid file type. Please upload a PDF file.`);
      setSuccessInfo(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccessInfo(null);
  };

  const handleFileRemove = () => {
    setFile(null);
    setError(null);
    setSuccessInfo(null);
  };

  const handleVerify = async () => {
    if (!file) {
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      setSuccessInfo(null);

      const metadata = await PDFMetadata.readMetadata(file);
      if (!metadata) {
        setError(
          "Document not recognized. It was either not completed with DocuSol or is invalid.",
        );
        setIsProcessing(false);
        return;
      }

      try {
        const documentStamp = await handleVerifyDocument(
          metadata.transaction,
          file,
        );
        setSuccessInfo({
          message: "Document successfully verified.",
          details: documentStamp,
        });
        setFile(null);
      } catch (err) {
        const error = err as Error;
        if (error.message === verificationErrors.TRANSACTION_NOT_FOUND) {
          setError(
            "Transaction not found. Please check the transaction signature.",
          );
        } else if (
          error.message === verificationErrors.TRANSACTION_MESSAGE_NOT_FOUND
        ) {
          setError(
            "Transaction message not found. Please check the transaction.",
          );
        } else if (error.message === verificationErrors.MEMO_NOT_FOUND) {
          setError("Memo not found. Please check the transaction.");
        } else if (error.message === verificationErrors.INVALID_VERSION) {
          setError("Invalid version. Please check the transaction.");
        } else if (error.message === verificationErrors.CONTENT_HASH_MISMATCH) {
          setError("Content has been modified.");
        } else {
          setError("An error occurred during verification. Please try again.");
        }
      }
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
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Verification Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {successInfo && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="success">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Verification Successful</AlertTitle>
                  <AlertDescription>
                    {successInfo.message}
                    {successInfo.details?.status?.state && (
                      <p className="mt-1">
                        <strong>Status:</strong>{" "}
                        {successInfo.details.status.state
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
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
