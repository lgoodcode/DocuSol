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
 * Dialog for deleting a signer. Used in the `ReviewStep` component.
 *
 * @param isOpen Whether the dialog is open
 * @param signerName Name of the signer being deleted
 * @param onClose Function to call when the dialog is closed
 * @param onConfirm Function to call when the deletion is confirmed
 */
export function DeleteSignerDialog({
  isOpen,
  onClose,
  onConfirm,
  signerName,
}: {
  isOpen: boolean;
  signerName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  if (!signerName) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Signer</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{signerName}</strong> from
            this document?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Alert variant="destructive">
            <AlertDescription>
              This action cannot be undone. All fields assigned to this signer
              will be permanently removed from the document.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete Signer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
