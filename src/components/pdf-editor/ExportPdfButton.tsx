import React, { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { exportPdfWithFields } from "@/lib/pdf-editor/pdf-export";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const ExportPdfButton: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filename, setFilename] = useState("document.pdf");

  const { fields, documentDataUrl } = useDocumentStore((state) => ({
    fields: state.fields,
    documentDataUrl: state.documentDataUrl,
  }));

  const handleExport = async () => {
    if (!filename.trim()) {
      toast.error("Please enter a valid filename");
      return;
    }

    // Add .pdf extension if not present
    const finalFilename = filename.endsWith(".pdf")
      ? filename
      : `${filename}.pdf`;

    try {
      setIsExporting(true);

      // Check if PDF is loaded
      if (!documentDataUrl) {
        throw new Error("No PDF document loaded");
      }

      // Export the PDF with fields
      await exportPdfWithFields(documentDataUrl, finalFilename, fields);

      toast.success("PDF exported successfully");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={!documentDataUrl}>
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export PDF with Form Fields</DialogTitle>
          <DialogDescription>
            Export your document with all form fields embedded as interactive
            AcroForm fields.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="filename" className="text-right">
              Filename
            </Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="col-span-3"
              placeholder="document.pdf"
            />
          </div>

          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
            <div className="flex items-start">
              <Info className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p>The exported PDF will include:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>Interactive, fillable form fields</li>
                  <li>Compatible with Adobe Acrobat and other PDF readers</li>
                  <li>Digital signature fields where applicable</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="submit"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      "Export"
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create interactive PDF with embedded form fields</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
