"use client";

import Image from "next/image";
import { useState } from "react";
import {
  UploadIcon as FileUpload,
  Pencil,
  Save,
  Trash2,
  Lock,
} from "lucide-react";
import { z } from "zod";
import { captureException } from "@sentry/nextjs";

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

const passwordSchema = z
  .object({
    password: z.string(),
    confirmPassword: z.string(),
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

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // const [expiryDays, setExpiryDays] = useState("7");
  const [signatureType, setSignatureType] = useState("draw"); // "draw" or "type"
  const [typedSignature, setTypedSignature] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (
      !file ||
      (!hasDrawn && signatureType === "draw") ||
      (!typedSignature && signatureType === "type")
    )
      return;

    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setPasswordError(result.error.message);
      return;
    }

    // Get the signature as a data URL if drawn
    const signatureDataUrl =
      signatureType === "draw" ? canvasRef.current?.toDataURL() : null;

    try {
      // Here you would typically send the data to your server
      console.log("Submitting:", {
        file,
        signature: signatureType === "draw" ? signatureDataUrl : typedSignature,
        password,
        // expiryDays,
        signatureType,
      });
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* File Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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

      {/* Document Options Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Document Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password Protection */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="password" className="mb-1">
              Password Protection (Optional)
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to protect document"
            />
            {password && (
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="mt-2"
              />
            )}
            {passwordError && (
              <p className="text-sm text-destructive mt-1">{passwordError}</p>
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

      {/* Signature Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start gap-4 sm:gap-0 sm:items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Sign Document
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={signatureType} onValueChange={setSignatureType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Signature type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draw">Draw</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
            {signatureType === "draw" && (
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
            <div className="relative aspect-[3/1] w-full border rounded-lg overflow-hidden bg-background dark:bg-background/60">
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
            <div className="grid w-full gap-1.5">
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
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="ml-auto"
            disabled={
              !file || (signatureType === "draw" ? !hasDrawn : !typedSignature)
            }
          >
            <Save className="h-5 w-5" />
            Save Document
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
