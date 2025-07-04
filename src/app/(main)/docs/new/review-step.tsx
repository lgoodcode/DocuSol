"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { captureException } from "@sentry/nextjs";
import { Trash2, Info, CalendarIcon, RefreshCcw, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import {
  isPastDate,
  formDocumentMetadataSchema,
  type FormDocumentMetadata,
} from "@/lib/pdf-editor/document-types";
import { DocumentSigner } from "@/lib/types/stamp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useResetDocument } from "./utils";
import { ResetDocumentDialog } from "./reset-document-dialog";
import { EditSignerDialog } from "./edit-signer-dialog";
import { DeleteSignerDialog } from "./delete-signer-dialog";

/**
 * Review step component for the document creation flow
 *
 * @param onStepComplete Function to call when the step is completed
 */
export function ReviewStep({ onStepComplete }: { onStepComplete: () => void }) {
  const {
    documentName,
    signers,
    setCurrentStep,
    removeSigner,
    updateSigner,
    isEncrypted,
    setIsEncrypted,
    encryptionPassword,
    setEncryptionPassword,
    isExpirationEnabled,
    setIsExpirationEnabled,
    expirationDate,
    setExpirationDate,
    senderMessage,
    setSenderMessage,
    setFormDocumentMetadata,
  } = useDocumentStore();
  const resetDocument = useResetDocument();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isEditSignerDialogOpen, setIsEditSignerDialogOpen] = useState(false);
  const [currentSignerToEdit, setCurrentSignerToEdit] =
    useState<DocumentSigner | null>(null);
  const [isDeleteSignerDialogOpen, setIsDeleteSignerDialogOpen] =
    useState(false);
  const [currentSignerToDelete, setCurrentSignerToDelete] =
    useState<DocumentSigner | null>(null);
  const isOnlySigner = signers.length === 1;

  // Initialize form with values from the document store
  const documentMetadataForm = useForm<FormDocumentMetadata>({
    resolver: zodResolver(formDocumentMetadataSchema),
    defaultValues: {
      documentName,
      isEncrypted,
      encryptionPassword: encryptionPassword || "",
      isExpirationEnabled,
      expirationDate,
      senderMessage,
    },
  });

  const handleBack = () => {
    setCurrentStep("fields");
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await resetDocument();
      setIsResetDialogOpen(false);
      setCurrentStep("upload");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Error resetting document:", error);
      captureException(error);
      toast.error("Reset Failed", {
        description: "Failed to reset document. Please try again.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenEditSignerDialog = (signer: DocumentSigner) => {
    setCurrentSignerToEdit(signer);
    setIsEditSignerDialogOpen(true);
  };

  const handleSaveEditedSigner = async (updatedSigner: DocumentSigner) => {
    try {
      updateSigner(updatedSigner.id, updatedSigner);
      setIsEditSignerDialogOpen(false);
      setCurrentSignerToEdit(null);
    } catch (error) {
      console.error("Error updating signer:", error);
      captureException(error);
      toast.error("Update Failed", {
        description: "Failed to update signer. Please try again.",
      });
      throw error;
    }
  };

  const handleOpenDeleteSignerDialog = (signer: DocumentSigner) => {
    setCurrentSignerToDelete(signer);
    setIsDeleteSignerDialogOpen(true);
  };

  const handleConfirmDeleteSigner = async () => {
    try {
      removeSigner(currentSignerToDelete!.id);
      setIsDeleteSignerDialogOpen(false);
      setCurrentSignerToDelete(null);
    } catch (error) {
      console.error("Error deleting signer:", error);
      captureException(error);
      toast.error("Delete Failed", {
        description: "Failed to delete signer. Please try again.",
      });
      throw error;
    }
  };

  const onSubmit = (metadata: FormDocumentMetadata) => {
    setFormDocumentMetadata(metadata);
    onStepComplete();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <ResetDocumentDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleReset}
        isLoading={isResetting}
      />

      <EditSignerDialog
        isOpen={isEditSignerDialogOpen}
        signer={currentSignerToEdit}
        onSave={handleSaveEditedSigner}
        onClose={() => setIsEditSignerDialogOpen(false)}
      />

      <DeleteSignerDialog
        isOpen={isDeleteSignerDialogOpen}
        signerName={currentSignerToDelete?.name || ""}
        onClose={() => setIsDeleteSignerDialogOpen(false)}
        onConfirm={handleConfirmDeleteSigner}
      />

      <div className="container mx-auto max-w-4xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Document Recipients Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">
                Document Recipients
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Review your signers
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="pb-2 font-medium text-muted-foreground">
                        Email Address
                      </th>
                      <th className="pb-2 font-medium text-muted-foreground">
                        Role
                      </th>
                      <th className="pb-2 font-medium text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {signers.map((signer, index) => (
                      <tr key={signer.id || index} className="border-b">
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {signer.name || "Unnamed"}
                          </div>
                        </td>
                        <td className="py-4">{signer.email}</td>
                        <td className="py-4">
                          <Badge variant="outline" className="capitalize">
                            {signer.role.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditSignerDialog(signer)}
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>

                            <TooltipProvider>
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleOpenDeleteSignerDialog(signer)
                                      }
                                      disabled={isOnlySigner}
                                      className={
                                        isOnlySigner
                                          ? "cursor-not-allowed opacity-50"
                                          : "group transition-colors duration-200"
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                {isOnlySigner && (
                                  <TooltipContent>
                                    <p>At least one recipient is required</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Document Settings Form */}
          <Form {...documentMetadataForm}>
            <form
              onSubmit={documentMetadataForm.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-semibold">
                    Document Settings
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Once submitted, these settings cannot be changed
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={documentMetadataForm.control}
                    name="documentName"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Document Name</FormLabel>
                        {/* <FormDescription>
                        Document name should not exceed 200 characters.
                      </FormDescription> */}
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-muted"
                            placeholder="Enter document name"
                            // TODO: make editable - requires update storage path
                            readOnly
                            // onChange={(e) => {
                            //   // Clear error when user changes the input
                            //   if (
                            //     documentMetadataForm.formState.errors.documentName
                            //   ) {
                            //     documentMetadataForm.clearErrors("documentName");
                            //   }
                            //   field.onChange(e);
                            //   // Store value immediately
                            //   setDocumentName(e.target.value);
                            // }}
                            // onBlur={async (e) => {
                            //   field.onBlur();
                            //   // Validate document name on blur
                            //   const name = e.target.value;
                            //   if (name) {
                            //     try {
                            //       const isNameValid =
                            //         await validateDocumentName(name);
                            //       if (!isNameValid) {
                            //         documentMetadataForm.setError(
                            //           "documentName",
                            //           {
                            //             type: "manual",
                            //             message: "Document name already exists",
                            //           },
                            //         );
                            //       }
                            //     } catch (error) {
                            //       console.error(
                            //         "Error validating document name:",
                            //         error,
                            //       );
                            //     }
                            //   }
                            // }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={documentMetadataForm.control}
                      name="isEncrypted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <FormLabel>Document Encryption</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-[200px]">
                                      All recipients need this password to
                                      decrypt and view the document
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <FormDescription>
                              All recipients need this password to decrypt and
                              view the document
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                setIsEncrypted(checked);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {documentMetadataForm.watch("isEncrypted") && (
                      <div className="border-l-2 border-primary/20 pl-6">
                        <FormField
                          control={documentMetadataForm.control}
                          name="encryptionPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Enter Password"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    setEncryptionPassword(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={documentMetadataForm.control}
                      name="isExpirationEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Set Document Expiration</FormLabel>
                            <FormDescription>
                              The document becomes read-only after this date
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                setIsExpirationEnabled(checked);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {documentMetadataForm.watch("isExpirationEnabled") && (
                      <div className="border-l-2 border-primary/20 pl-6">
                        <FormField
                          control={documentMetadataForm.control}
                          name="expirationDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormControl>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={`justify-start text-left font-normal ${
                                        !field.value && "text-muted-foreground"
                                      }`}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={(date) => {
                                        field.onChange(date);
                                        setExpirationDate(date);
                                      }}
                                      initialFocus
                                      disabled={isPastDate}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sender's Message Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-semibold">
                    Sender&apos;s Message
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Send a customized message to document recipients. This
                    message will not be stored anywhere or encrypted.
                  </p>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={documentMetadataForm.control}
                    name="senderMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder='You can use this field as a password hint. "The password is the time we first met".'
                            className="min-h-[100px] resize-none"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setSenderMessage(e.target.value);
                            }}
                          />
                        </FormControl>
                        <div className="mt-2 text-right text-sm text-muted-foreground">
                          Character remaining:{" "}
                          {1000 - (field.value?.length || 0)}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isResetting}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setIsResetDialogOpen(true)}
                    disabled={isResetting}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={isResetting}
                  className="min-w-[120px]"
                >
                  {isResetting ? "Resetting..." : "Submit"}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </>
  );
}
