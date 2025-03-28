import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Send, MoreVertical, Eye, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { loadPdfDocument } from "@/lib/pdf-editor/pdf-loader";

export const EditorHeader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>("");

  const pdfFile = useDocumentStore((state) => state.documentFile);

  const handleSend = () => {
    toast("Document ready to send", {
      description: "Recipients will be notified to sign the document.",
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is a PDF
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    // Store the file name
    setFileName(file.name);

    try {
      // Use await with toast.promise to properly handle the promise
      await toast.promise(loadPdfDocument(file), {
        loading: "Loading PDF document...",
        success: "PDF document loaded successfully",
        error: "Failed to load PDF document",
      });
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast.error("Failed to load PDF document");
    } finally {
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
      <div className="flex items-center space-x-4">
        {!!pdfFile ? (
          <>
            <h1 className="text-lg font-medium text-gray-900">
              {fileName || "PDF Document"}
            </h1>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-gray-50 text-gray-500">
                Draft
              </Badge>
            </div>
          </>
        ) : (
          <h1 className="text-lg font-medium text-gray-900">
            PDF Place Editor
          </h1>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />

        {/* Upload PDF button - more prominent when no PDF is loaded */}
        <Button
          variant={!pdfFile ? "default" : "outline"}
          size="sm"
          className="h-9"
          onClick={handleUploadClick}
        >
          <Upload className="mr-2 h-4 w-4" />
          <span>{!pdfFile ? "Upload PDF" : "Replace PDF"}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Eye className="mr-2 h-4 w-4" />
              <span>Preview</span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Preview as recipient</DropdownMenuItem>
            <DropdownMenuItem>Preview as completed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={handleSend} className="h-9">
          <Send className="mr-2 h-4 w-4" />
          <span>Send</span>
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
