"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useForm } from "react-hook-form";
import { captureException } from "@sentry/nextjs";
import { ShieldCheck, XCircle, CheckCircle } from "lucide-react";

import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
} from "@/constants";
import { isTransactionSignature } from "@/lib/utils/solana";
import { FileUpload } from "@/components/ui/file-upload";
import { DocumentDetails } from "@/components/doc-details";
import { FilePreview } from "@/components/file-preview";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatFileSize } from "@/lib/utils/format-file-size";

const searchSchema = z.object({
  txSignature: z
    .string({
      required_error: "File hash or transaction signature is required",
    })
    .refine(isTransactionSignature, {
      message: "Must be a transaction signature",
    }),
  file: z
    .custom<File>((file) => file instanceof File, {
      message: "File is required",
    })
    .refine((file) => file && file.size <= MAX_FILE_SIZE, {
      message: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`,
    })
    .refine(
      (file) => {
        if (!file) return false;
        const ext = `.${file.type.split("/").pop()!}`;
        return ACCEPTED_FILE_EXTENSIONS.includes(ext);
      },
      {
        message: "Invalid file type. Please upload a PDF or image file.",
      },
    ),
});

export function VerifyDocContent() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [documentDetails, setDocumentDetails] = useState<VerifyDocument | null>(
    null,
  );
  const [success, setSuccess] = useState(false);
  const [errorResponseMessage, setErrorResponseMessage] = useState<
    string | null
  >(null);
  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    mode: "onSubmit",
  });

  const handleFileChange = (file: File) => {
    setFile(file);
  };

  const handleFileRemove = () => {
    setFile(null);
    form.reset({
      txSignature: form.getValues("txSignature"),
      file: undefined,
    });
  };

  const onSearchSubmit = async ({
    txSignature,
    file,
  }: z.infer<typeof searchSchema>) => {
    setErrorResponseMessage(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      Object.entries({ txSignature, file }).forEach(([key, value]) => {
        formData.append(key, value || "");
      });
      const response = await fetch("/api/docs/verify", {
        method: "POST",
        body: formData,
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (response.status === 500) {
        throw new Error("Internal server error");
      }

      const data = await response.json();
      if (data.error) {
        setErrorResponseMessage(data.error);
        setDocumentDetails(null);
        return;
      } else if (!data.matches) {
        setErrorResponseMessage(
          "The file you provided does not match the file hash in the transaction signature provided.",
        );
        setDocumentDetails(null);
        return;
      }

      setSuccess(true);
      setDocumentDetails(data.verifyDocument as VerifyDocument);
    } catch (error) {
      captureException(error);
      toast({
        title: "Error",
        description: "An error occurred while verifying the document",
        variant: "destructive",
      });
    }
  };

  // Update form value when file changes
  useEffect(() => {
    if (file) {
      form.setValue("file", file as File, {
        shouldValidate: true,
      });
    }
  }, [file, form]);

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
          <h1 className="text-2xl font-bold md:text-3xl">Verify Document</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Verify a document that has been signed with DocuSol.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ShieldCheck className="h-5 w-5" />
              Verify Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSearchSubmit)}
                className="space-y-4"
              >
                {/* Error response message */}
                {errorResponseMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <p className="flex items-center gap-2 text-sm text-destructive md:text-base">
                        <XCircle className="h-4 w-4" />
                        {errorResponseMessage}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Success response message */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="rounded-lg border border-success/50 bg-success/10 p-4">
                      <p className="flex items-center gap-2 text-sm text-success md:text-base">
                        <CheckCircle className="h-4 w-4" />
                        The document you provided matches the document in the
                        transaction signature.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="grid w-full gap-6">
                  <div className="flex w-full flex-1 flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="txSignature"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Transaction Signature</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="search"
                              placeholder="Enter transaction signature"
                              className="w-full pl-4"
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
                            Enter the transaction signature of the document you
                            want to verify.
                          </FormDescription>
                          <FormMessage className="text-sm" />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col gap-2">
                      <div className="flex w-full flex-row gap-2">
                        <FileUpload
                          file={file}
                          accept={Object.keys(ACCEPTED_FILE_TYPES)}
                          onChange={handleFileChange}
                          onRemove={handleFileRemove}
                          disabled={form.formState.isSubmitting}
                        />
                      </div>
                      <FormMessage className="text-sm">
                        {form.formState.errors.file?.message}
                      </FormMessage>
                    </div>
                  </div>

                  {/* Verify Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Verifying..." : "Verify"}
                  </Button>
                </div>

                {file && <FilePreview file={file} />}
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>

      {documentDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          <DocumentDetails document={documentDetails} partial />
        </motion.div>
      )}
    </>
  );
}
