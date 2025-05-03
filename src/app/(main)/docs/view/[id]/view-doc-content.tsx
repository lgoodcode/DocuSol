// "use client";

// import { useState } from "react";
// import { motion } from "framer-motion";
// import { zodResolver } from "@hookform/resolvers/zod";
// import z from "zod";
// import { useForm } from "react-hook-form";
// import { captureException } from "@sentry/nextjs";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// import { useToast } from "@/hooks/use-toast";
// import { DocumentDetails } from "@/components/doc-details";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";

// const passwordSchema = z.object({
//   password: z.string().min(1, { message: "Password is required" }),
// });

// export function ViewDocContent({ document }: { document: DocumentDetails }) {
//   const { toast } = useToast();
//   const [isValid, setIsValid] = useState(!Boolean(document.password));
//   const [showPasswordDialog, setShowPasswordDialog] = useState(
//     Boolean(document.password)
//   );
//   const [hasAttempted, setHasAttempted] = useState(false);
//   const passwordForm = useForm<z.infer<typeof passwordSchema>>({
//     resolver: zodResolver(passwordSchema),
//     mode: "onSubmit",
//   });

//   const handleCancel = () => {
//     setShowPasswordDialog(false);
//     setHasAttempted(true);
//     passwordForm.reset();
//   };

//   const handlePasswordSubmit = async ({
//     password,
//   }: z.infer<typeof passwordSchema>) => {
//     try {
//       const response = await fetch("/api/docs/search", {
//         method: "POST",
//         body: JSON.stringify({
//           value: document.signed_hash || document.unsigned_hash,
//           password,
//         }),
//       });

//       if (response.status === 403) {
//         passwordForm.setError("password", {
//           message: "Invalid password",
//         });
//         return;
//       }

//       setIsValid(true);
//       setShowPasswordDialog(false);
//       passwordForm.reset();
//     } catch (error) {
//       captureException(error);
//       toast({
//         title: "Error",
//         description: "An error occurred while accessing the document",
//         variant: "destructive",
//       });
//     }
//   };

//   return (
//     <>
//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{
//           duration: 0.5,
//           ease: "easeOut",
//         }}
//       >
//         <div className="flex flex-col gap-2">
//           <h1 className="text-2xl md:text-3xl font-bold">View Document</h1>
//           <p className="text-sm md:text-base text-muted-foreground">
//             View the details of the document.
//           </p>
//         </div>
//       </motion.div>

//       <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
//         <DialogContent>
//           <Form {...passwordForm}>
//             <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
//               <DialogHeader>
//                 <DialogTitle>Password Required</DialogTitle>
//                 <DialogDescription>
//                   This document is password protected. Please enter the password
//                   to view it.
//                 </DialogDescription>
//               </DialogHeader>
//               <div className="grid gap-4 py-4">
//                 <div className="space-y-2">
//                   <FormField
//                     control={passwordForm.control}
//                     name="password"
//                     render={({ field }) => (
//                       <FormItem className="w-full">
//                         <FormLabel>Password</FormLabel>
//                         <FormControl>
//                           <Input
//                             {...field}
//                             id="password"
//                             type="password"
//                             placeholder="Enter document password"
//                             autoComplete="off"
//                           />
//                         </FormControl>
//                         <FormMessage className="text-sm" />
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               </div>
//               <DialogFooter className="flex flex-col gap-2">
//                 <Button type="button" variant="outline" onClick={handleCancel}>
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   disabled={!passwordForm.formState.isValid}
//                   isLoading={passwordForm.formState.isSubmitting}
//                 >
//                   Submit
//                 </Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>

//       {isValid && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3 }}
//           className="mt-8"
//         >
//           <DocumentDetails document={document} />
//         </motion.div>
//       )}

//       {!isValid && hasAttempted && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3 }}
//           className="mt-8"
//         >
//           <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
//             <p className="text-sm text-destructive">
//               Unable to access document. The document is password protected.
//             </p>
//           </div>
//         </motion.div>
//       )}
//     </>
//   );
// }
