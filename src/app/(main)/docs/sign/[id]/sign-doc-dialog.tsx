"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/ui/copy-button";
import { getTransactionUrl } from "@/lib/utils/solana";

export function SignDocumentDialog({
  showDialog,
  setShowDialog,
  handleCloseDialog,
  results,
}: {
  showDialog: boolean;
  setShowDialog: (showDialog: boolean) => void;
  handleCloseDialog: () => void;
  results: SignedDocumentResult | null;
}) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (window) {
      setUrl(window.location.origin);
    }
  }, []);

  if (!results) {
    return null;
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        autoFocus={false}
        tabIndex={-1}
      >
        <DialogHeader>
          <DialogTitle>Document Signed</DialogTitle>
          <DialogDescription>
            Your document has been signed, and the hash stored in the
            blockchain.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          {/* Content */}
          <div className="grid gap-4">
            {/* Transaction Link */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                View transaction:
              </span>
              <a
                href={getTransactionUrl(results.txSignature)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm hover:text-primary underline underline-offset-4"
              >
                <span>Solana Explorer</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* File Hash */}
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">File Hash</Label>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted-foreground/10 dark:bg-muted/50">
                <code className="text-xs sm:text-sm font-mono break-all flex-1">
                  {results.signedHash}
                </code>
                <CopyButton value={results.signedHash} />
              </div>
            </div>

            {/* View Link */}
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">View Link</Label>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted-foreground/10 dark:bg-muted/50">
                <code className="text-xs sm:text-sm font-mono break-all flex-1">
                  {`${url}/docs/view/${results.id}`}
                </code>
                <CopyButton value={`${url}/docs/view/${results.id}`} />
              </div>
              <p className="text-xs text-muted-foreground">
                This link can be used to view the signed document.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={handleCloseDialog}
              autoFocus={false}
              tabIndex={-1}
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
