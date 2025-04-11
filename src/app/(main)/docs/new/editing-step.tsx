"use client";

import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { DocumentCanvas } from "@/components/pdf-editor/DocumentCanvas";
import { FieldsList } from "@/components/pdf-editor/FieldsList";
import { FieldsPalette } from "@/components/pdf-editor/FieldsPalette";
import { Button } from "@/components/ui/button";

export function EditingStep({
  onStepComplete,
}: {
  onStepComplete: () => void;
}) {
  const { viewType, documentDataUrl, setCurrentStep, setSelectedFieldId } =
    useDocumentStore();

  const handleBack = () => {
    setCurrentStep("signers");
    setSelectedFieldId("");
  };

  const handleNext = () => {
    setCurrentStep("review");
    setSelectedFieldId("");
    onStepComplete();
  };

  if (!documentDataUrl) {
    throw new Error("There is no document to edit");
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-4">
      <div className="flex h-[calc(100vh-240px)] overflow-hidden rounded-lg border bg-background shadow-md">
        <div className="relative flex-1 overflow-hidden rounded-l-lg">
          <DocumentCanvas />
        </div>

        <div className="w-96 border-l">
          {viewType === "editor" ? <FieldsPalette /> : <FieldsList />}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button type="button" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
