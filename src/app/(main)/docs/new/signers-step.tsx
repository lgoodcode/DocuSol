"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { captureException } from "@sentry/nextjs";
import { XCircle, Trash2, Plus, Search, Pencil } from "lucide-react";

import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { createClient } from "@/lib/supabase/client";
import { getUser } from "@/lib/supabase/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  validateEmail,
  validateName,
  toTitleCase,
  checkDuplicateEmail,
} from "./utils";

export function SignersStep({
  onStepComplete,
}: {
  onStepComplete: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [addedMyself, setAddedMyself] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [editingSignerId, setEditingSignerId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEmailError, setEditEmailError] = useState<string | null>(null);
  const { signers, addSigner, updateSigner, removeSigner } = useDocumentStore();

  const handleAddSigner = () => {
    try {
      const email = inputValue.trim();
      const name = toTitleCase(nameValue.trim());

      const nameValidationError = validateName(name);
      if (nameValidationError) {
        setNameError(nameValidationError);
      } else {
        setNameError(null);
      }

      const emailValidationError = validateEmail(email);
      if (emailValidationError) {
        setInputError(emailValidationError);
      } else {
        setInputError(null);
      }

      if (nameValidationError || emailValidationError) {
        return;
      }

      const duplicateError = checkDuplicateEmail(signers, email);
      if (duplicateError) {
        setInputError(duplicateError);
        return;
      }

      addSigner({
        name,
        email,
        isOwner: false,
        role: "participant",
        mode: "transparent",
      });

      setInputValue("");
      setNameValue("");
      setInputError(null);
      setNameError(null);
      setError(null);

      // Set focus to the name input field for UX
      const nameInput = document.getElementById("signer-name");
      if (nameInput) {
        nameInput.focus();
      }
    } catch (err) {
      setError("Failed to add signer");
      captureException(err);
    }
  };

  const handleRemoveSigner = (id: string) => {
    try {
      const signerToRemove = signers.find((signer) => signer.id === id);
      if (signerToRemove?.isOwner) {
        setAddedMyself(false);
      }

      // Remove signer from the store
      removeSigner(id);
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
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email,
          isOwner: true,
          role: "participant",
          mode: "transparent",
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

  const handleEditSigner = (id: string) => {
    const signer = signers.find((signer) => signer.id === id);
    if (!signer) return;
    setEditName(signer.name);
    setEditEmail(signer.email);
    setEditEmailError(null);
    setEditingSignerId(signer.id);
  };

  const handleSaveEdit = () => {
    try {
      if (editingSignerId === null) return;

      // Title case the name before validation/saving
      const formattedName = toTitleCase(editName.trim());
      setEditName(formattedName);

      // Skip validation for myself
      if (!signers.find((signer) => signer.id === editingSignerId)?.isOwner) {
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
          editingSignerId,
        );
        if (duplicateError) {
          setEditEmailError(duplicateError);
          return;
        }
      }

      // Update signer in the store
      updateSigner(editingSignerId, {
        name: formattedName,
        email: editEmail,
      });

      setEditingSignerId(null);
      setEditEmailError(null);
      setError(null);
    } catch (err) {
      setError("Failed to update signer");
      captureException(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingSignerId(null);
    setEditName("");
    setEditEmail("");
    setEditEmailError(null);
  };

  const handleContinue = () => {
    if (signers.length === 0) {
      setError("Please add at least one signer");
      return;
    }

    onStepComplete();
  };

  // Check if we already have ourselves in the signers list
  useEffect(() => {
    const myselfExists = signers.some((signer) => signer.isOwner);
    setAddedMyself(myselfExists);
  }, [signers]);

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddSigner();
          }}
          className="flex flex-col gap-4"
        >
          {/* Input Fields container */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Name Input Group */}
            <div className="space-y-2">
              <label htmlFor="signer-name" className="text-sm font-medium">
                Signer Name
              </label>
              <Input
                id="signer-name"
                value={nameValue}
                onChange={(e) => {
                  setNameValue(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="Enter signer's name"
                className={`${nameError ? "border-destructive" : ""}`}
              />
              {nameError && (
                <p className="mt-1 text-xs text-destructive">{nameError}</p>
              )}
            </div>
            {/* Email Input Group */}
            <div className="space-y-2">
              <label htmlFor="signer-email" className="text-sm font-medium">
                Signer Email
              </label>
              <Input
                id="signer-email"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder="Enter signer's email address"
                className={`${inputError ? "border-destructive" : ""}`}
              />
              {inputError && (
                <p className="mt-1 text-xs text-destructive">{inputError}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 gap-2">
            <Button type="submit" className="flex-1 md:flex-auto">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
            <Button
              type="button" // Prevent form submission
              disabled={addedMyself}
              onClick={handleAddMyself}
              className="flex-1 md:flex-auto"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Myself
            </Button>
          </div>
        </form>

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
                            {!signer.isOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSigner(signer.id)}
                                className="text-primary hover:bg-primary/10 hover:text-primary"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveSigner(signer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
          Next
        </Button>
      </div>

      {/* Edit Signer Dialog */}
      <Dialog
        open={editingSignerId !== null}
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
                  editingSignerId !== null &&
                  signers.find((signer) => signer.id === editingSignerId)
                    ?.isOwner
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
                {editingSignerId !== null &&
                  signers.find((signer) => signer.id === editingSignerId)
                    ?.isOwner && (
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
