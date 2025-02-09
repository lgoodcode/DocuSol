import { useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface RenameDocDialogProps {
  docId: string;
  currentName: string;
  isOpen: boolean;
  onClose: () => void;
}

const updateDocumentName = async (id: string, name: string) => {
  const supabase = createClient();
  const { error } = await supabase
    .from("documents")
    .update({ name: name.trim() })
    .eq("id", id);

  if (error) {
    throw error;
  }
  return null;
};

export function RenameDocDialog({
  docId,
  currentName,
  isOpen,
  onClose,
}: RenameDocDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    try {
      await updateDocumentName(docId, name.trim());
      toast({
        title: "Document renamed successfully",
        variant: "success",
      });

      router.refresh();
      onClose();
      setIsLoading(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
    </Dialog>
  );
}
