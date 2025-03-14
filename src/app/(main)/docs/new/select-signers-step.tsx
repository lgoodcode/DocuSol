"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { captureException } from "@sentry/nextjs";
import { XCircle, Plus, Search, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { createClient } from "@/lib/supabase/client";
import { getUser } from "@/lib/supabase/utils";
import { isValidEmail } from "@/lib/utils";
import { SignerRole } from "@/lib/types/stamp";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useDocumentStore, DocumentSigner } from "./useDocumentStore";

const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return "Please provide an email address";
  }

  if (!isValidEmail(email)) {
    return "Invalid email address";
  }

  return null;
};

/**
 * Checks if an email already exists in the signers list
 *
 * @param signers The list of signers to check against
 * @param email The email to check
 * @param excludeIndex Optional index to exclude from the check (for editing)
 * @returns Error message if duplicate, null otherwise
 */
const checkDuplicateEmail = (
  signers: DocumentSigner[],
  email: string,
  excludeIndex?: number,
): string | null => {
  const isDuplicate = signers.some(
    (signer, index) =>
      signer.email.toLowerCase() === email.toLowerCase() &&
      index !== excludeIndex,
  );

  return isDuplicate
    ? `A signer with email ${email} has already been added`
    : null;
};

export function SelectSignersStep({
  onStepComplete,
}: {
  onStepComplete: () => void;
}) {
  // Get signers and actions from the store
  const { signers, addSigner, updateSigner, removeSigner, setCurrentStep } =
    useDocumentStore();
  const [error, setError] = useState<string | null>(null);
  const [addedMyself, setAddedMyself] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEmailError, setEditEmailError] = useState<string | null>(null);

  const handleAddSigner = () => {
    try {
      const email = inputValue.trim();
      const emailError = validateEmail(email);
      if (emailError) {
        setInputError(emailError);
        return;
      }

      const duplicateError = checkDuplicateEmail(signers, email);
      if (duplicateError) {
        setInputError(duplicateError);
        return;
      }

      // Add signer to the store
      addSigner({
        name: "",
        email,
        isMyself: false,
        role: SignerRole.PARTICIPANT,
      });

      setInputValue("");
      setInputError(null);
      setError(null);
    } catch (err) {
      setError("Failed to add signer");
      captureException(err);
    }
  };

  const handleRemoveSigner = (index: number) => {
    try {
      const signerToRemove = signers[index];
      if (signerToRemove.isMyself) {
        setAddedMyself(false);
      }

      // Remove signer from the store
      removeSigner(index);
    } catch (err) {
      setError("Failed to remove signer");
      captureException(err);
    }
  };

  const handleAddMyself = async () => {
    try {
      if (addedMyself) {
        return;
      }

      const supabase = createClient();
      try {
        const user = await getUser(supabase);
        const email = user.email;

        // Check for duplicate email before adding myself
        const duplicateError = checkDuplicateEmail(signers, email);
        if (duplicateError) {
          setError(duplicateError);
          return;
        }

        // Add myself to the store
        addSigner({
          name: `${user.firstName} ${user.lastName}`,
          email,
          isMyself: true,
          role: SignerRole.OWNER,
        });

        setAddedMyself(true);
        setError(null);
      } catch (err) {
        throw err;
      }
    } catch (err) {
      setError("Failed to add yourself");
      captureException(err);
    }
  };

  const handleEditSigner = (index: number) => {
    const signer = signers[index];
    setEditName(signer.name);
    setEditEmail(signer.email);
    setEditEmailError(null);
    setEditingIndex(index);
  };

  const handleSaveEdit = () => {
    try {
      if (editingIndex === null) return;

      // Skip validation for myself
      if (!signers[editingIndex].isMyself) {
        // Validate email
        const emailError = validateEmail(editEmail);
        if (emailError) {
          setEditEmailError(emailError);
          return;
        }

        // Check for duplicate email, excluding the current signer
        const duplicateError = checkDuplicateEmail(
          signers,
          editEmail,
          editingIndex,
        );
        if (duplicateError) {
          setEditEmailError(duplicateError);
          return;
        }
      }

      // Update signer in the store
      updateSigner(editingIndex, {
        name: editName,
        email: editEmail,
      });

      setEditingIndex(null);
      setEditEmailError(null);
      setError(null);
    } catch (err) {
      setError("Failed to update signer");
      captureException(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditName("");
    setEditEmail("");
    setEditEmailError(null);
  };

  const handleContinue = () => {
    if (signers.length === 0) {
      setError("Please add at least one signer");
      return;
    }

    // Update the current step in the store and call onStepComplete
    setCurrentStep("fields");
    onStepComplete();
  };

  // Check if we already have ourselves in the signers list
  useEffect(() => {
    const myselfExists = signers.some((signer) => signer.isMyself);
    setAddedMyself(myselfExists);
  }, [signers]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Invite Signers</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Invite signers by email addresses
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Clear error when typing
                  if (inputError) setInputError(null);
                }}
                placeholder="Enter a contact's email address"
                className={`pr-10 ${inputError ? "border-destructive" : ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddSigner();
                  }
                }}
              />
            </div>
            <Button onClick={handleAddSigner}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
            <Button disabled={addedMyself} onClick={handleAddMyself}>
              <Plus className="h-4 w-4" />
              Add Myself
            </Button>
          </div>

          {/* Error message for input - outside the flex layout */}
          {inputError && (
            <div>
              <p className="text-sm text-destructive">{inputError}</p>
            </div>
          )}
        </div>

        <Card className="mt-6">
          <CardContent className="space-y-6 pt-6">
            {/* Error response message */}
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

            <AnimatePresence>
              {signers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="rounded-full p-3">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No Signer Added</h3>
                  <p className="text-sm text-muted-foreground">
                    There is no signer added to the contract.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {signers.map((signer, index) => (
                    <motion.div
                      key={signer.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">
                            {signer.name || "Unnamed Signer"}
                          </p>
                          <div className="flex items-center gap-2">
                            {!signer.isMyself && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSigner(index)}
                                className="text-primary hover:bg-primary/10 hover:text-primary"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSigner(index)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {signer.email}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <div className="mt-4 flex justify-end">
        <Button disabled={signers.length === 0} onClick={handleContinue}>
          Continue
        </Button>
      </div>

      {/* Edit Signer Dialog */}
      <Dialog
        open={editingIndex !== null}
        onOpenChange={(open) => !open && handleCancelEdit()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Signer</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit();
            }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter signer's name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                value={editEmail}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  // Clear error when typing
                  if (editEmailError) setEditEmailError(null);
                }}
                placeholder="Enter signer's email"
                className={editEmailError ? "border-destructive" : ""}
                disabled={
                  editingIndex !== null && signers[editingIndex]?.isMyself
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                }}
              />
              <div className="h-5">
                {editEmailError && (
                  <p className="text-sm text-destructive">{editEmailError}</p>
                )}
                {editingIndex !== null && signers[editingIndex]?.isMyself && (
                  <p className="text-xs text-muted-foreground">
                    You cannot change your own email address
                  </p>
                )}
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
