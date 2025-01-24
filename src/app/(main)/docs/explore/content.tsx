"use client";

import bs58 from "bs58";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { captureException } from "@sentry/nextjs";
import { Search } from "lucide-react";

import { hexToBuffer } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FilePreview } from "@/components/file-preview";

const searchSchema = z.object({
  txSignature: z
    .string({
      required_error: "Transaction signature is required",
    })
    .refine((tx) => bs58.decode(tx).length === 88, {
      message: "Invalid transaction signature",
    }),
});

export function ExploreContent() {
  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
  });

  const onSubmit = async ({ txSignature }: z.infer<typeof searchSchema>) => {
    try {
      // Here you would typically make an API call to fetch the document
      // const { error, data } = await supabase.from("documents")...

      // For demonstration, assuming we get back a hex string
      const hexString = ""; // Retrieved hex string
      const buffer = hexToBuffer(hexString);
      const blob = new Blob([buffer], { type: "application/pdf" });
      // Handle the blob with FilePreview component
    } catch (error) {
      console.error(error);
      captureException(error);
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="px-2 py-4 md:p-6">
              <CardContent className="px-2">
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4">
                  <div className="relative w-full flex flex-1 flex-col sm:flex-row gap-4">
                    <FormField
                      control={form.control}
                      name="txSignature"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="flex items-center gap-2 mb-1">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            Transaction Signature
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="search"
                              placeholder="Enter transaction signature"
                              className="w-full pl-8"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end">
                      <Button className="w-full md:w-fit" type="submit">
                        Search
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </form>
      </Form>
      {/* Add FilePreview component here when blob is available */}
    </>
  );
}
