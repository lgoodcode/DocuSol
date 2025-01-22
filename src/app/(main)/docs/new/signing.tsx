"use client";

import Image from "next/image";
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
} from "lucide-react";

import { useDrawing } from "@/hooks/use-drawing";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
  const { canvasRef, startDrawing, draw, hasDrawn, stopDrawing, clearCanvas } =
    useDrawing();

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
    )
      return;

    // Get the signature as a data URL if drawn
    const signatureDataUrl =
      signatureType === "draw" ? canvasRef.current?.toDataURL() : null;

    try {
      // Here you would typically send the data to your server
      console.log("Submitting:", {
        name,
        file,
        signature: signatureType === "draw" ? signatureDataUrl : typedSignature,
        password,
        signatureType,
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast({
        title: "Document signed",
        description: "Your document has been signed and saved",
        variant: "success",
      });

      form.reset({
        name: "",
        password: "",
        confirmPassword: "",
      });
      clearFile();
      clearCanvas();
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
          <h1 className="text-2xl font-bold">New Document</h1>
          <p className="text-sm text-muted-foreground">
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
                <div className="grid w-full">
                  <div className="flex justify-between gap-2">
                    <Input
                      ref={fileInputRef}
                      id="document"
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {file && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={clearFile}
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    )}
                  </div>
                </div>

                {preview && (
                  <div className="max-h-[400px] w-full max-w-sm mx-auto overflow-hidden rounded-md border">
                    {file?.type === "application/pdf" ? (
                      <iframe
                        src={preview}
                        className="w-full h-[400px]"
                        title="Document preview"
                      />
                    ) : (
                      <div className="relative h-[300px] w-full">
                        <Image
                          src={preview}
                          alt="Document preview"
                          className="object-contain"
                          fill
                          sizes="(max-width: 640px) 100vw, 640px"
                        />
                      </div>
                    )}
                  </div>
                )}
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
                          <Input placeholder="Enter password" {...field} />
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
                            <Input placeholder="Enter password" {...field} />
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
