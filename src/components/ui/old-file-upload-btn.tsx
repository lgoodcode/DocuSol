import { FileText, Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

import { ACCEPTED_FILE_EXTENSIONS } from "@/constants";
import { Button } from "@/components/ui/button";

export function OldFileUploadBtn({
  form,
  fileInputRef,
  handleFileChange,
  clearFile,
  file,
}: {
  form: UseFormReturn;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearFile: () => void;
  file: File | null;
}) {
  return (
    <>
      {/* File Input */}
      <Button
        variant="outline"
        className="w-full md:w-auto"
     disabled={form.formState.isSubmitting}
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
     accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
     disabled={form.formState.isSubmitting}
     className="hidden"
   />
   {file && (
     <Button
       type="button"
       variant="destructive"
       size="icon"
       onClick={clearFile}
       disabled={form.formState.isSubmitting}
     >
       <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove file</span>
        </Button>
      )}
    </>
  );
}
