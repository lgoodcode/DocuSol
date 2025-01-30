"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { captureException } from "@sentry/nextjs";
import { Pencil, Trash2, FileText } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { hexToBuffer, storeNewDocument } from "@/lib/utils";
import { uploadSignedDocument, sign } from "@/lib/utils/sign";
import { useDrawing } from "@/hooks/use-drawing";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FilePreview } from "@/components/file-preview";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { SignDocumentDialog } from "./sign-doc-dialog";

// const TEST_RESULTS = {
//   id: "6371048f-7aba-4d41-bfb8-73435458b881",
//   txSignature:
//     "TiwrWVwVYkFWQF16ZsM622NAUJAcTJGw66iYcxvpRTnQDoZakUtsQbEnZewt6jJUKm8XsNmpZ2HpV56288dEUwH",
//   signedHash:
//     "df1af2ed785db434e9f1e7f16e8342e9621b0f8a9aa14e40ceee9953c6eb9b7a",
// };

const getDocument = async (id: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id,mime_type,unsigned_document")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error(error);
      captureException(error, {
        extra: { id },
      });
    }
    throw error;
  }

  return data;
};

const passwordSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});

export function SignDocumentContent({
  id,
  docDocument,
  docPassword,
}: {
  id: string;
  docDocument: DocumentToSign | null;
  docPassword: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    canvasRef,
    startDrawing,
    draw,
    hasDrawn,
    getSignatureAsBlack,
    stopDrawing,
    clearCanvas,
  } = useDrawing();
  const [document, setDocument] = useState<DocumentToSign | null>(docDocument);
  const [unsignedDoc, setUnsignedDoc] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isValid, setIsValid] = useState(!Boolean(docPassword));
  const [signatureType, setSignatureType] = useState("draw"); // "draw" or "type"
  const [typedSignature, setTypedSignature] = useState("");
  const [showDialog, setShowDialog] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(
    Boolean(docPassword)
  );
  const [results, setResults] = useState<SignedDocumentResult | null>(null);
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    mode: "onSubmit",
  });

  const handleCloseDialog = () => {
    setShowDialog(false);
    setResults(null);
    router.push("/dashboard");
  };

  const handleCancelPasswordDialog = () => {
    setShowPasswordDialog(false);
    setHasAttempted(true);
    passwordForm.reset();
  };

  const handlePasswordSubmit = async ({
    password,
  }: z.infer<typeof passwordSchema>) => {
    try {
      if (password !== docPassword) {
        passwordForm.setError("password", {
          message: "Invalid password",
        });
        return;
      }

      setIsValid(true);
      setShowPasswordDialog(false);
      passwordForm.reset();

      setDocument(await getDocument(id));
    } catch (error) {
      captureException(error);
      toast({
        title: "Error",
        description: "An error occurred while accessing the document",
        variant: "destructive",
      });
    }
  };

  const handleSign = async () => {
    if (
      !document ||
      !unsignedDoc ||
      (signatureType === "draw" && !hasDrawn) ||
      (signatureType === "type" && !typedSignature)
    ) {
      return;
    }

    setIsSubmitting(true);

    let signedDoc: Blob | null = null;
    try {
      signedDoc = await sign(
        unsignedDoc,
        signatureType === "draw" ? getSignatureAsBlack() : null,
        signatureType === "type" ? typedSignature : undefined
      );

      if (!signedDoc) {
        throw new Error("Failed to sign document");
      }
    } catch (err) {
      const error = err as Error;
      let errMsg: string;
      console.error(error);
      if (error.message.includes("encrypted")) {
        errMsg = "The document is encrypted and cannot be modified";
      } else {
        errMsg = "An error occurred while signing the document";
        captureException(error);
      }
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const { error, txSignature, signedHash } = await uploadSignedDocument({
        id: document.id,
        signed_document: signedDoc,
      });

      if (error) {
        throw new Error(error);
      } else if (!txSignature || !signedHash) {
        throw new Error("Failed to upload document");
      }

      storeNewDocument({ id, txSignature, signedHash }).catch((error) => {
        console.error("Error storing document:", error);
        captureException(error, {
          extra: {
            id,
            txSignature,
            signedHash,
          },
        });
      });

      setResults({ id, txSignature, signedHash });
      setShowDialog(true);

      clearCanvas();
      setTypedSignature("");
    } catch (error) {
      console.error(error);
      captureException(error);
      toast({
        title: "Error",
        description: "An error occurred while signing the document",
        variant: "destructive",
      });
    }
  };

  // Convert the unsigned document to a blob to preview it
  useEffect(() => {
    if (window && isValid && document) {
      const buffer = hexToBuffer(document.unsigned_document);
      const blob = new Blob([buffer], { type: document.mime_type });
      setUnsignedDoc(blob);
    }
  }, [document, isValid]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Sign Document</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Sign a document with your signature.
          </p>
        </div>
      </motion.div>

      <SignDocumentDialog
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        handleCloseDialog={handleCloseDialog}
        results={results}
      />

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
              <DialogHeader>
                <DialogTitle>Password Required</DialogTitle>
                <DialogDescription>
                  This document is password protected. Please enter the password
                  to view it.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="password"
                            type="password"
                            placeholder="Enter document password"
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage className="text-sm" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelPasswordDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!passwordForm.formState.isValid}
                  isLoading={passwordForm.formState.isSubmitting}
                >
                  Submit
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {!isValid && hasAttempted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Unable to access document. The document is password protected.
            </p>
          </div>
        </motion.div>
      )}

      {isValid && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* File Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Preview Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unsignedDoc && <FilePreview file={unsignedDoc} />}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {/* Signature Card */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start gap-4 sm:gap-0 sm:items-center justify-between">
                <div className="flex flex-col gap-1 max-w-sm">
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <Pencil className="h-5 w-5" />
                    Sign Document
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={signatureType}
                    onValueChange={setSignatureType}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Signature type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draw">Draw</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>
                  {signatureType === "draw" && hasDrawn && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      disabled={!hasDrawn || isSubmitting}
                      onClick={clearCanvas}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Clear signature</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {signatureType === "draw" ? (
                  <div className="relative aspect-[3/2] sm:aspect-[3/1] w-full border rounded-lg overflow-hidden bg-background dark:bg-background/60">
                    <canvas
                      ref={canvasRef}
                      width={900}
                      height={300}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="touch-none w-full h-full"
                      aria-label="Signature canvas"
                    />
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="grid w-full gap-1.5"
                  >
                    <Label htmlFor="typed-signature" className="mb-1">
                      Type your signature
                    </Label>
                    <Input
                      id="typed-signature"
                      autoComplete="off"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="Type your signature here"
                      disabled={isSubmitting}
                    />
                  </motion.div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="ml-auto"
                  isLoading={isSubmitting}
                  disabled={!hasDrawn && !typedSignature}
                  onClick={handleSign}
                >
                  Sign Document
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </>
      )}
    </>
  );
}
