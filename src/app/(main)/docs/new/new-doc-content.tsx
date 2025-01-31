"use client";

import { useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { captureException } from "@sentry/nextjs";
import { UploadIcon, Pencil, Save, Trash2, Lock, FileText } from "lucide-react";

import { storeNewDocument } from "@/lib/utils";
import { uploadNewDocument, sign } from "@/lib/utils/sign";
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
  const {
    canvasRef,
    startDrawing,
    draw,
    hasDrawn,
    getSignatureAsBlack,
    stopDrawing,
    clearCanvas,
  } = useDrawing();
  const [signatureType, setSignatureType] = useState("draw"); // "draw" or "type"
  const [typedSignature, setTypedSignature] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<NewDocumentResult | null>(null);
  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    mode: "onSubmit",
  });

  const handleFileRemove = (file: File) => {
    setFiles((prevFiles) => prevFiles.filter((f) => f.name !== file.name));
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setResults(null);
  };

  const onSubmit = async ({
    name,
    password,
  }: z.infer<typeof documentSchema>) => {
    if (!files.length) {
      return;
    }

    const isSigned =
      (signatureType === "draw" && hasDrawn) ||
      (signatureType === "type" && typedSignature);

    let signedDoc: Blob | null = null;
    if (isSigned) {
      try {
        signedDoc = await sign(
          files[0],
          signatureType === "draw" ? getSignatureAsBlack() : null,
          signatureType === "type" ? typedSignature : undefined
        );
      } catch (err) {
        const error = err as Error;
        console.error(error);
        if (error.message.includes("encrypted")) {
          toast({
            title: "Error",
            description: "The document is encrypted and cannot be modified",
            variant: "destructive",
          });
          return;
        }

        captureException(error);
        toast({
          title: "Error",
          description: "An error occurred while signing the document",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const { error, id, txSignature, unsignedHash } = await uploadNewDocument({
        name,
        password: password || "",
        original_filename: files[0].name,
        mime_type: files[0].type,
        original_document: files[0],
        unsigned_document: signedDoc || files[0],
      });

      if (error) {
        throw new Error(error);
      } else if (!id || !txSignature || !unsignedHash) {
        throw new Error("Failed to upload document");
      }

      storeNewDocument({ id, txSignature, unsignedHash }).catch((error) => {
        console.error("Error storing document:", error);
        captureException(error, {
          extra: {
            id,
            txSignature,
            unsignedHash,
          },
        });
      });

      setResults({ id, txSignature, unsignedHash });
      setShowDialog(true);

      form.reset({ name: "", password: "", confirmPassword: "" });
      setFiles([]);
      clearCanvas();
      setTypedSignature("");
    } catch (error) {
      console.error(error);
      captureException(error);
      toast({
        title: "Error",
        description: "An error occurred while uploading the document",
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
          <h1 className="text-2xl md:text-3xl font-bold">New Document</h1>
          <p className="text-sm md:text-base text-muted-foreground">
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
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <UploadIcon className="h-5 w-5" />
                  Upload Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  files={files}
                  onChange={setFiles}
                  onRemove={handleFileRemove}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* File Preview Card */}
          <AnimatePresence mode="wait">
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Document Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {files.length > 0 && <FilePreview file={files[0]} />}
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
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
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
                            type="password"
                            placeholder="Enter password"
                            autoComplete="off"
                            {...field}
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
                              type="password"
                              placeholder="Enter password"
                              autoComplete="off"
                              {...field}
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
              <CardHeader className="flex flex-col sm:flex-row items-start gap-4 sm:gap-0 sm:items-center justify-between">
                <div className="flex flex-col gap-1 max-w-sm">
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
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
                    onValueChange={setSignatureType}
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
                  disabled={!files.length}
                >
                  <Save className="h-4 w-4" />
                  Save Document
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </form>
      </Form>
    </>
  );
}
