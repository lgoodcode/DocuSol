"use client";

import { useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { captureException } from "@sentry/nextjs";
import { UploadIcon, Pencil, Save, Trash2, Lock, FileText } from "lucide-react";

import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/constants";
import { useUploadNewDocument } from "@/lib/utils/sign";
import { formatFileSize } from "@/lib/utils/format-file-size";
import { useDrawing } from "@/hooks/use-drawing";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { FilePreview } from "@/components/file-preview";
import {
  Card,
  CardContent,
  CardDescription,
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useSignDoc } from "./hooks";
import { NewDocumentDialog } from "./new-doc-dialog";

const documentSchema = z
  .object({
    name: z.string({
      required_error: "Document name is required",
    }),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// const TEST_RESULTS = {
//   id: "6371048f-7aba-4d41-bfb8-73435458b881",
//   txSignature:
//     "TiwrWVwVYkFWQF16ZsM622NAUJAcTJGw66iYcxvpRTnQDoZakUtsQbEnZewt6jJUKm8XsNmpZ2HpV56288dEUwH",
//   unsignedHash:
//     "df1af2ed785db434e9f1e7f16e8342e9621b0f8a9aa14e40ceee9953c6eb9b7a",
// };

export function NewDocumentContent() {
  const { toast } = useToast();
  const signDoc = useSignDoc();
  // const checkBalance = useUserHasSufficientBalance();
  const {
    canvasRef,
    startDrawing,
    draw,
    hasDrawn,
    getSignatureAsBlack,
    stopDrawing,
    clearCanvas,
  } = useDrawing();
  const uploadNewDocument = useUploadNewDocument();
  const [signatureType, setSignatureType] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<NewDocumentResult | null>(null);
  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    mode: "onSubmit",
  });

  const handleFileRemove = () => {
    setFile(null);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setResults(null);
  };

  const onSubmit = async ({
    name,
    password,
  }: z.infer<typeof documentSchema>) => {
    if (!file) {
      return;
    }

    let signedDoc: Blob | null = null;
    const isSigned =
      (signatureType === "draw" && hasDrawn) ||
      (signatureType === "type" && typedSignature);

    try {
      // TODO: revise this with improved pdf editor
      signedDoc = !isSigned
        ? file
        : await signDoc(
            file,
            signatureType,
            hasDrawn,
            getSignatureAsBlack(),
            typedSignature,
          );
    } catch (err) {
      const error = err as Error;
      console.error(error);

      if (error.message.includes("encrypted")) {
        toast({
          title: "Invalid Document",
          description: "This document is encrypted and cannot be processed.",
          variant: "destructive",
        });
      }
    }

    if (!signedDoc) {
      return;
    }

    // const hasSufficientBalance = await checkBalance();
    // if (!hasSufficientBalance) {
    //   return;
    // }

    // PDF Metadata and file hashing
    if (!(signedDoc instanceof Blob) || signedDoc.type !== "application/pdf") {
      throw new Error("Invalid document type");
    }

    try {
      const { error, id, txSignature, unsignedHash } = await uploadNewDocument({
        name,
        password: password || "",
        original_filename: file.name,
        mime_type: file.type,
        original_document: file,
        unsigned_document: signedDoc,
      });

      if (error) {
        throw new Error(error);
      } else if (!id || !txSignature || !unsignedHash) {
        throw new Error("Failed to upload document");
      }

      setResults({ id, txSignature, unsignedHash });
      setShowDialog(true);

      form.reset({ name: "", password: "", confirmPassword: "" });
      setFile(null);
      clearCanvas();
      setTypedSignature("");
    } catch (err) {
      const error = err as Error;
      console.error(error);
      captureException(error);

      if (error.message.includes("encrypted")) {
        toast({
          title: "Invalid Document",
          description: "This document is encrypted and cannot be processed.",
          variant: "destructive",
        });
      }

      const isTooLarge = error.message.includes("Request Entity Too Large");
      toast({
        title: "Error",
        description: isTooLarge
          ? `The file is too large. Please try a smaller file. (Max file size: ${formatFileSize(
              MAX_FILE_SIZE,
            )})`
          : "An error occurred while uploading the document",
        variant: "destructive",
      });
    }
  };

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
          <h1 className="text-2xl font-bold md:text-3xl">New Document</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Sign your document with your signature.
          </p>
        </div>
      </motion.div>

      <NewDocumentDialog
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        handleCloseDialog={handleCloseDialog}
        results={results}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* File Upload Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <UploadIcon className="h-5 w-5" />
                  Upload Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  file={file}
                  accept={Object.keys(ACCEPTED_FILE_TYPES)}
                  onChange={setFile}
                  onRemove={handleFileRemove}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* File Preview Card */}
          <AnimatePresence mode="wait">
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <FileText className="h-5 w-5" />
                      Document Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {file && <FilePreview file={file} />}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Document Options Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Lock className="h-5 w-5" />
                  Document Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter document name"
                          {...field}
                          disabled={form.formState.isSubmitting}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              form.handleSubmit(onSubmit)(e);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Protection */}
                <div className="grid w-full gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password Protection (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter password"
                            autoComplete="off"
                            disabled={form.formState.isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          Will be used to protect your document. If not set, the
                          document will be public.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  {form.getValues("password") && (
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter password"
                              autoComplete="off"
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                          <FormDescription>
                            Please enter the password again to confirm.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Expiry Setting */}
                {/* <div className="grid w-full gap-1.5">
              <Label htmlFor="expiry" className="mb-1">
                Document Expiry
              </Label>
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger id="expiry">
                  <SelectValue placeholder="Select expiry period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">24 hours</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
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
              <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-0">
                <div className="flex max-w-sm flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Pencil className="h-5 w-5" />
                    Sign Document
                  </CardTitle>
                  <CardDescription>
                    This is optional and will be applied to the unsigned
                    document that gets hashed for verification.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={signatureType}
                    onValueChange={(value) =>
                      setSignatureType(value as "draw" | "type")
                    }
                    disabled={form.formState.isSubmitting}
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
                      disabled={!hasDrawn || form.formState.isSubmitting}
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
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border bg-background dark:bg-background/60 sm:aspect-[3/1]">
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
                      className="h-full w-full touch-none"
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
                      disabled={form.formState.isSubmitting}
                    />
                  </motion.div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="ml-auto"
                  isLoading={form.formState.isSubmitting}
                  disabled={!file}
                >
                  {!form.formState.isSubmitting && <Save className="h-4 w-4" />}
                  {form.formState.isSubmitting
                    ? "Uploading..."
                    : "Upload Document"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </form>
      </Form>
    </>
  );
}
