import React, { useEffect, useRef } from "react";
import { Document, pdfjs } from "react-pdf";
import { toast } from "sonner";
import { captureException } from "@sentry/nextjs";
import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_PDF_WIDTH } from "@/lib/pdf-editor/constants";
import type { DocumentField } from "@/lib/pdf-editor/document-types";
import type { DocumentSigner } from "@/lib/types/stamp";

import { DocumentPage } from "./DocumentPage";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const DOCUMENT_OPTIONS = {
  cMapUrl: "/cmaps/",
  standardFontDataUrl: "/standard_fonts/",
};

// Interface for individual props required by Canvas and Page
interface DocumentCanvasProps {
  documentDataUrl: string | null;
  numPages: number | null;
  setNumPages: (num: number | null) => void;
  scale: number;
  fields: DocumentField[];
  updateField: (
    id: string,
    updates: Partial<Pick<DocumentField, "position" | "size" | "value">>,
  ) => void;
  addField?: (field: Omit<DocumentField, "id" | "assignedTo">) => void; // Optional editor action
  signers?: DocumentSigner[]; // Optional editor data
  currentSigner?: DocumentSigner | null; // Optional signer data
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;
  viewType: "editor" | "signer";
  // Props specifically for editor interactions passed down to DocumentPage
  isDragging?: boolean;
  isResizing?: boolean;
  setDragging?: (dragging: boolean) => void;
  setResizing?: (resizing: boolean) => void;
}

export function DocumentCanvas({
  documentDataUrl,
  numPages,
  setNumPages,
  scale,
  fields,
  updateField,
  addField,
  signers,
  currentSigner,
  selectedFieldId,
  setSelectedFieldId,
  viewType,
  isDragging,
  isResizing,
  setDragging,
  setResizing,
}: DocumentCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
    setNumPages(numPages);
  };

  // Deselect field on outside click (remains the same)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetElement = event.target as HTMLElement;
      if (
        canvasRef.current &&
        canvasRef.current.contains(targetElement) &&
        !targetElement.closest(
          "[data-field-id], .react-rnd, .react-resizable-handle", // More robust check for Rnd elements
        )
      ) {
        setSelectedFieldId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setSelectedFieldId, canvasRef]);

  const onDocumentLoadError = (error: Error): void => {
    console.error("Error loading PDF:", error);
    captureException(error);
    toast.error("Error loading PDF", {
      description:
        "Please try again. If the problem persists, please contact support.",
    });
  };

  if (!documentDataUrl) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground">Preparing document viewer...</p>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className="pdf-canvas absolute inset-0 overflow-auto bg-gray-100 p-4 dark:bg-gray-200"
    >
      <div
        className="pdf-document-container relative mx-auto"
        style={{
          width: `${DEFAULT_PDF_WIDTH * scale}px`,
          transition: "width 0.2s ease-in-out",
        }}
      >
        <Document
          file={documentDataUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex h-[50vh] items-center justify-center">
              <Spinner size="lg" />
              <p className="ml-2 text-muted-foreground">Loading PDF...</p>
            </div>
          }
          className="pdf-document"
        >
          {numPages &&
            Array.from(new Array(numPages), (el, index) => (
              <DocumentPage
                key={`page_${index}`}
                pageIndex={index}
                fields={fields}
                updateField={updateField}
                addField={addField}
                signers={signers}
                currentSigner={currentSigner}
                selectedFieldId={selectedFieldId}
                setSelectedFieldId={setSelectedFieldId}
                viewType={viewType}
                scale={scale}
                isDragging={isDragging}
                isResizing={isResizing}
                setDragging={setDragging}
                setResizing={setResizing}
              />
            ))}
        </Document>
      </div>
    </div>
  );
}
