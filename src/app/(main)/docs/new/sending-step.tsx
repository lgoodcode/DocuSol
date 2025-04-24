"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next-nprogress-bar";
import { motion } from "framer-motion";
import { captureException } from "@sentry/nextjs";
import { CheckCircle, XCircle, Loader2, Send, ChevronLeft } from "lucide-react";

import { IS_PROD } from "@/constants";
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { sendDraftDocument } from "./utils";

type SubmissionStatus = "idle" | "submitting" | "success" | "error";

/**
 * Sending component for the document creation flow.
 * Handles the final submission of the document and displays the status.
 */
export function SendingStep() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus>("idle");
  const { exportDocumentState, resetDocumentState, setCurrentStep } =
    useDocumentStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const submitDocument = async () => {
      setSubmissionStatus("submitting");
      setError(null);

      try {
        const documentState = exportDocumentState();

        if (!documentState.documentContentHash) {
          throw new Error("Document content hash is missing.");
        }
        if (documentState.signers.length === 0) {
          throw new Error("At least one signer is required.");
        }
        // Basic field validation (ensure every signer has at least one field)
        const signerIdsWithFields = new Set(
          documentState.fields.map((f) => f.assignedTo),
        );
        const allSignersHaveFields = documentState.signers.every((s) =>
          signerIdsWithFields.has(s.id),
        );
        if (!allSignersHaveFields && documentState.fields.length > 0) {
          // Allow submission if no fields are placed
          throw new Error("Every signer must be assigned at least one field.");
        }

        const resp = await sendDraftDocument(documentState, {
          memo: true,
          email: false,
          database: true,
        });
        console.log("resp", resp);

        // resetDocumentState(true);
        setSubmissionStatus("success");
      } catch (err: unknown) {
        console.error("Error submitting document:", err);
        captureException(err);
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
        setSubmissionStatus("error");
      }
    };

    if (isMounted && submissionStatus === "idle") {
      submitDocument();
    }
  }, [isMounted, submissionStatus]);

  const handleGoToDashboard = () => {
    router.push("/docs");
  };

  const handleRetry = () => {
    setSubmissionStatus("idle");
  };

  const handleBack = () => {
    setCurrentStep("review");
  };

  const handleStartNewDocument = () => {
    resetDocumentState();
    router.push("/docs/new");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto max-w-4xl py-10"
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
          <div className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <CardTitle>Sending Document</CardTitle>
          </div>
          {!IS_PROD && (
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" />
              Back (Dev)
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex min-h-[400px] items-center justify-center p-6 md:p-10">
          {(() => {
            switch (submissionStatus) {
              case "submitting":
                return (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <p className="text-lg font-medium">
                      Sending your document...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we process and send your document for
                      signing.
                    </p>
                  </div>
                );
              case "success":
                return (
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <p className="text-xl font-semibold">
                      Document Sent Successfully!
                    </p>
                    <p className="text-center text-muted-foreground">
                      Your document has been sent to all recipients. You can
                      track its status in your dashboard.
                    </p>
                    {/* Add button group for multiple actions */}
                    <div className="flex space-x-4">
                      <Button onClick={handleGoToDashboard} size="lg">
                        Go to Dashboard
                      </Button>
                      <Button
                        onClick={handleStartNewDocument}
                        variant="outline"
                        size="lg"
                      >
                        Start a New Document
                      </Button>
                    </div>
                  </div>
                );
              case "error":
                return (
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <XCircle className="h-16 w-16 text-destructive" />
                    <p className="text-xl font-semibold">Submission Failed</p>
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        {error ||
                          "An unexpected error occurred. Please try again."}
                      </AlertDescription>
                    </Alert>
                    <div className="flex space-x-4">
                      <Button onClick={handleRetry} variant="outline" size="lg">
                        Retry Submission
                      </Button>
                      <Button onClick={handleGoToDashboard} size="lg">
                        Go to Dashboard
                      </Button>
                    </div>
                  </div>
                );
              case "idle":
              default:
                return null;
            }
          })()}
        </CardContent>
      </Card>
    </motion.div>
  );
}
