import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { type DocumentSigner } from "@/lib/types/stamp";

import { validateEmail, validateName } from "./utils";

type EditSignerFormValues = z.infer<typeof editSignerSchema>;

interface EditSignerDialogProps {
  isOpen: boolean;
  signer: DocumentSigner | null;
  onClose: () => void;
  onSave: (updatedSigner: DocumentSigner) => Promise<void>;
}

const editSignerSchema = z.object({
  name: z.string().refine((val) => !validateName(val), {
    message: "Invalid name",
  }),
  email: z.string().refine((val) => !validateEmail(val), {
    message: "Invalid email address",
  }),
});

/**
 * Dialog for editing signer details. Used in the `ReviewStep` component.
 *
 * @param isOpen Whether the dialog is open
 * @param signer The signer object to edit
 * @param onClose Function to call when the dialog is closed
 * @param onSave Function to call when the save button is clicked
 */
export function EditSignerDialog({
  isOpen,
  signer,
  onClose,
  onSave,
}: EditSignerDialogProps) {
  const form = useForm<EditSignerFormValues>({
    resolver: zodResolver(editSignerSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Reset form when signer changes or dialog opens/closes
  useEffect(() => {
    if (isOpen && signer) {
      form.reset({
        name: signer.name || "",
        email: signer.email,
      });
    } else if (!isOpen) {
      // Reset form fully when dialog closes
      form.reset({ name: "", email: "" });
    }
  }, [isOpen, signer, form]);

  const handleSave = async (values: EditSignerFormValues) => {
    if (!signer) return;
    await onSave({
      ...signer,
      name: values.name,
      email: values.email,
    });
  };

  if (!signer) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Signer</DialogTitle>
          <DialogDescription>
            Update the name or email address for this recipient.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="edit-signer-form"
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSave, (errors) => {
              console.log(errors);
              console.log(form.getValues());
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-signer-form" // Link button to the form
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
