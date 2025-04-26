import { useState } from "react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";

import { deleteDocument as deleteDocumentDb } from "./db";
import type { ViewDocument } from "./types";

interface DeleteDocDialogProps {
  doc: ViewDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

const deleteDocument = async (
  doc: ViewDocument,
  queryClient: QueryClient,
): Promise<void> => {
  await deleteDocumentDb(doc);
  // TODO: remove once indexedDB is gone
  // await removeStoredDocument(doc.id);

  queryClient.invalidateQueries({ queryKey: ["documents"] });
  queryClient.setQueryData<ViewDocument[]>(["documents"], (oldData) => {
    return oldData?.filter((d) => d.id !== doc.id) ?? [];
  });
};

export function DeleteDocDialog({ doc, onClose }: DeleteDocDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await deleteDocument(doc!, queryClient);
      onClose();
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Failed to delete document",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!doc) return null;

  return (
    <Dialog open={!!doc} onOpenChange={onClose}>
      <DialogPortal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete{" "}
                <span className="font-bold">{doc.name}</span>?
              </p>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDelete} className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Alert variant="destructive">
                <AlertDescription>
                  This action cannot be undone and will remove access for all
                  users who have signed or were invited to sign this document.
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
              <Button type="submit" disabled={isLoading} variant="destructive">
                Delete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
