import { useState, memo, useCallback, useMemo } from "react";
import { Document, pdfjs } from "react-pdf";
import { toast } from "sonner";
import { captureException } from "@sentry/nextjs";
import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { dataUrlToFile } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

import { DocumentPage } from "./DocumentPage";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const DOCUMENT_OPTIONS = {
  cMapUrl: "/cmaps/",
  standardFontDataUrl: "/standard_fonts/",
};

export const DocumentCanvas = memo(function DocumentCanvas() {
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const pdfDataUrl = useDocumentStore((state) => state.documentDataUrl);
  const scale = useDocumentStore((state) => state.scale);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: nextNumPages }: PDFDocumentProxy): void => {
      setNumPages(nextNumPages);
      setIsLoading(false);
    },
    [],
  );

  const onDocumentLoadError = useCallback((error: Error): void => {
    console.error("Error loading PDF:", error);
    captureException(error);
    setIsLoading(false);
    toast.error("Error loading PDF", {
      description:
        "Please try again. If the problem persists, please contact support.",
    });
  }, []);

  const pdfFile = useMemo(() => {
    return pdfDataUrl ? dataUrlToFile(pdfDataUrl, "document.pdf") : null;
  }, [pdfDataUrl]);

  // Memoize the pages array to prevent unnecessary re-renders
  const pages = useMemo(() => {
    return Array.from(new Array(numPages), (_el, index) => (
      <DocumentPage key={`page_${index}`} pageIndex={index} scale={scale} />
    ));
  }, [numPages, scale]);

  if (!pdfDataUrl) {
    throw new Error("No document available");
  }

  // Render the document canvas
  return (
    <div className="flex h-full w-full flex-col">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="xl" />
            <p className="mt-2 text-sm text-muted-foreground">
              Loading document...
            </p>
          </div>
        </div>
      )}

      {/* Document pages */}
      <div className="h-full w-full overflow-auto scrollbar-thin scrollbar-track-transparent">
        <div className="mx-auto flex flex-col items-center justify-start p-4">
          <Document
            file={pdfFile}
            className="flex w-full flex-col items-center justify-center gap-4"
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            options={DOCUMENT_OPTIONS}
            loading={
              <div className="flex h-40 w-full items-center justify-center">
                <Spinner size="lg" />
              </div>
            }
          >
            {pages}
          </Document>
        </div>
      </div>
    </div>
  );
});
