import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Reset dialog component for confirming document reset. Used in the `ReviewStep` component.`
 *
 * @param isOpen Whether the dialog is open
 * @param onClose Function to call when the dialog is closed
 * @param onConfirm Function to call when the reset is confirmed
 */
export function ResetDocumentDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Document</DialogTitle>
          <DialogDescription>
            Are you sure you want to reset this document? This will clear all
            data and start over.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Alert variant="destructive">
            <AlertDescription>
              This action cannot be undone. All document data, including
              signers, fields, and settings will be permanently removed.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
