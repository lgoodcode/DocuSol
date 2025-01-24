"use client";

import { useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { captureException } from "@sentry/nextjs";
import {
  UploadIcon as FileUpload,
  Pencil,
  Save,
  Trash2,
  Lock,
  FileText,
} from "lucide-react";

import { formatFileSize } from "@/lib/utils/format-file-size";
import { useDrawing } from "@/hooks/use-drawing";
import { useFileUpload } from "@/hooks/use-file-upload";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { uploadFile, sign } from "./utils";
import { storeDocument } from "@/lib/utils";
import { getTransactionUrl } from "@/lib/utils/solana";

const ACCEPTED_FILE_TYPES = [".pdf", ".jpeg", ".png", ".jpg"];

const documentSchema = z
  .object({
    name: z.string().min(1, "Document name is required"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function DocumentSigning() {
  const { toast } = useToast();
  const { file, preview, handleFileChange, clearFile, fileInputRef } =
    useFileUpload();
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
  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
  });

  const onSubmit = async ({
    name,
    password,
  }: z.infer<typeof documentSchema>) => {
    if (
      !file ||
      (!hasDrawn && signatureType === "draw") ||
      (!typedSignature && signatureType === "type")
    ) {
      return;
    }

    try {
      const signedDoc = await sign(
        file,
        signatureType === "draw" ? getSignatureAsBlack() : null,
        signatureType === "type" ? typedSignature : undefined
      );

      if (!signedDoc) {
        throw new Error("Failed to sign document");
      }

      const { error, id, txSignature, unsignedHash } = await uploadFile({
        name,
        password: password || "",
        original_filename: file.name,
        mime_type: file.type,
        unsigned_document: file,
        signed_document: signedDoc,
      });

      if (error) {
        throw new Error(error);
      } else if (!id || !txSignature || !unsignedHash) {
        throw new Error("Failed to upload document");
      }

      storeDocument({ id, txSignature, unsignedHash }).catch((error) => {
        console.error("Error storing document:", error);
        captureException(error, {
          extra: {
            id,
            txSignature,
            unsignedHash,
          },
        });
      });

      const txUrl = getTransactionUrl(txSignature!);
      toast({
        title: "Document signed",
        description: (
          <>
            Your document has been signed and saved. You can view the
            transaction on{" "}
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Solana Explorer
            </a>
            . Refer to the memo for the document hash.
          </>
        ),
        variant: "success",
      });

      form.reset({ name: "", password: "", confirmPassword: "" });
      clearFile();
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* File Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <FileUpload className="h-5 w-5" />
                  Upload Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full gap-2">
                  <div className="flex flex-row gap-2">
                    <Button
                      variant="outline"
                      className="w-full md:w-auto"
                      onClick={(e) => {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      Select File
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept={ACCEPTED_FILE_TYPES.join(",")}
                      className="hidden"
                    />
                    {file && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={clearFile}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    )}
                  </div>
                  {file && (
                    <div className="space-y-1">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Selected: {file.name}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Size: {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {preview && <FilePreview file={file} preview={preview} />}
              </CardContent>
            </Card>
          </motion.div>

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
                        <Input placeholder="Enter document name" {...field} />
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
                            {...field}
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
                              {...field}
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
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Pencil className="h-5 w-5" />
                  Sign Document
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={signatureType}
                    onValueChange={setSignatureType}
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
                      disabled={!hasDrawn}
                      onClick={clearCanvas}
                    >
                      <Trash2 className="h-5 w-5" />
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
                    />
                  </motion.div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="ml-auto"
                  isLoading={form.formState.isSubmitting}
                  disabled={
                    !file ||
                    (signatureType === "draw" ? !hasDrawn : !typedSignature)
                  }
                >
                  <Save className="h-5 w-5" />
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
