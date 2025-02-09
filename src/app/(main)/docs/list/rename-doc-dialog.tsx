import { useState } from "react";
import { useRouter } from "next-nprogress-bar";

import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";

import { renameDocument as renameDocumentDb } from "./db";

interface RenameDocDialogProps {
  doc: ViewDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const renameDocument = async (
  doc: ViewDocument,
  newName: string,
  queryClient: QueryClient,
): Promise<void> => {
  await renameDocumentDb({
    ...doc,
    name: newName,
  });

  queryClient.setQueryData<ViewDocument[]>(["documents"], (oldData) => {
    return (
      oldData?.map((d) => (d.id === doc.id ? { ...d, name: newName } : d)) ?? []
    );
  });
};

export function RenameDocDialog({ doc, onClose }: RenameDocDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(doc?.name ?? "");
  const [isLoading, setIsLoading] = useState(false);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    try {
      await renameDocument(doc!, name.trim(), queryClient);
      router.refresh();
      onClose();
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Failed to rename document",
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
            <DialogTitle>Rename document</DialogTitle>
            <DialogDescription>
              Enter a new name for your document
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRename}>
            <div className="grid gap-6 py-4">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Document name"
                autoFocus
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !name.trim()}>
                  Rename
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
