"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useForm } from "react-hook-form";
import { captureException } from "@sentry/nextjs";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { DocumentDetails } from "@/components/doc-details";
import { isTransactionSignature } from "@/lib/utils/solana";
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

const searchSchema = z.object({
  hashOrSignature: z
    .string({
      required_error: "File hash or transaction signature is required",
    })
    .refine(
      (val) => isTransactionSignature(val) || /^[a-f0-9]{64}$/i.test(val),
      {
        message: "Must be a valid hash or transaction signature",
      }
    ),
});

const passwordSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});

export function ExploreDocsContent() {
  const { toast } = useToast();
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingHash, setPendingHash] = useState("");
  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    mode: "onSubmit",
  });
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    mode: "onSubmit",
  });

  const handleCancel = () => {
    setShowPasswordDialog(false);
    passwordForm.reset();
    setPendingHash("");
  };

  const onSearchSubmit = async ({
    hashOrSignature,
  }: z.infer<typeof searchSchema>) => {
    try {
      const response = await fetch("/api/docs/search", {
        method: "POST",
        body: JSON.stringify({ value: hashOrSignature }),
      });

      if (response.status === 401) {
        setPendingHash(hashOrSignature);
        setShowPasswordDialog(true);
        return;
      }

      const data = await response.json();
      if (data.error) {
        if (data.error === "Invalid transaction signature: no hash found") {
          searchForm.setError("hashOrSignature", {
            message: data.error,
          });
          return;
        } else if (data.error === "Document not found") {
          toast({
            title: "Document not found",
            description: "The document you are looking for does not exist",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error);
      }

      setDocument(data as DocumentDetails);
    } catch (error) {
      captureException(error);
      toast({
        title: "Error",
        description: "An error occurred while searching for the document",
        variant: "destructive",
      });
    }
  };

  const handlePasswordSubmit = async ({
    password,
  }: z.infer<typeof passwordSchema>) => {
    try {
      const response = await fetch("/api/docs/search", {
        method: "POST",
        body: JSON.stringify({ value: pendingHash, password }),
      });

      if (response.status === 403) {
        passwordForm.setError("password", {
          message: "Invalid password",
        });
        return;
      }

      const data = (await response.json()) as DocumentDetails;
      setDocument(data);
      setShowPasswordDialog(false);
      setPendingHash("");
      passwordForm.reset();
    } catch (error) {
      captureException(error);
      toast({
        title: "Error",
        description: "An error occurred while accessing the document",
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
          <h1 className="text-2xl md:text-3xl font-bold">Explore</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Search for documents and files that have been signed with DocuSol.
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
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search for Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...searchForm}>
              <form
                onSubmit={searchForm.handleSubmit(onSearchSubmit)}
                className="space-y-8"
              >
                <div className="grid w-full gap-2">
                  <div className="flex w-full flex-1 flex-col gap-4">
                    <FormField
                      control={searchForm.control}
                      name="hashOrSignature"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Transaction Signature</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="search"
                              placeholder="Enter transaction signature"
                              className="w-full pl-4"
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
                            Enter the transaction signature of a signed
                            document.
                          </FormDescription>
                          <FormMessage className="text-sm" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      isLoading={searchForm.formState.isSubmitting}
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>

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
                <Button type="button" variant="outline" onClick={handleCancel}>
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

      {document && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          <DocumentDetails document={document} />
        </motion.div>
      )}
    </>
  );
}
