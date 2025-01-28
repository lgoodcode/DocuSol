"use client";

import { useState, useEffect } from "react";
import { AlertCircle, ExternalLink } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/ui/copy-button";
import { getTransactionUrl } from "@/lib/utils/solana";

export function NewDocumentDialog({
  showDialog,
  setShowDialog,
  handleCloseDialog,
  results,
}: {
  showDialog: boolean;
  setShowDialog: (showDialog: boolean) => void;
  handleCloseDialog: () => void;
  results: {
    id: string;
    txSignature: string;
    unsignedHash: string;
  } | null;
}) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (window) {
      setUrl(window.location.origin);
    }
  }, []);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Document Signed</DialogTitle>
          <DialogDescription>
            Your document has been saved, and the hash stored in the blockchain.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          {/* Transaction Link */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              View transaction:
            </span>
            <a
              href={getTransactionUrl(results?.txSignature || "")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm hover:text-primary underline underline-offset-4"
            >
              <span>Solana Explorer</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Warning Alert */}
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription className="text-sm">
              The hash is stored in the blockchain and can be used to verify the
              document&apos;s integrity. For privacy, you can delete this and
              create a new document with a password.
            </AlertDescription>
          </Alert>

          {/* File Hash */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">File Hash</Label>
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted-foreground/20 dark:bg-muted/50">
              <code className="text-xs sm:text-sm font-mono break-all flex-1">
                {results?.unsignedHash}
              </code>
              <CopyButton value={results?.unsignedHash || ""} />
            </div>
          </div>

          {/* Share Link */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Share Link</Label>
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted-foreground/20 dark:bg-muted/50">
              <code className="text-xs sm:text-sm font-mono break-all flex-1">
                {`${url}/docs/sign/${results?.id}`}
              </code>
              <CopyButton value={`${url}/docs/sign/${results?.id}`} />
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with the recipient to view and sign the document
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
