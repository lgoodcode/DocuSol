"use client";

import { useShallow } from "zustand/react/shallow";

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
  const {
    viewType,
    documentDataUrl,
    numPages,
    setNumPages,
    scale,
    fields,
    updateField,
    addField,
    signers,
    selectedFieldId,
    setSelectedFieldId,
    isDragging,
    isResizing,
    setDragging,
    setResizing,
    setCurrentStep,
  } = useDocumentStore(
    useShallow((state) => ({
      viewType: state.viewType,
      documentDataUrl: state.documentDataUrl,
      numPages: state.numPages,
      setNumPages: state.setNumPages,
      scale: state.scale,
      fields: state.fields,
      updateField: state.updateField,
      addField: state.addField,
      signers: state.signers,
      selectedFieldId: state.selectedFieldId,
      setSelectedFieldId: state.setSelectedFieldId,
      isDragging: state.isDragging,
      isResizing: state.isResizing,
      setDragging: state.setDragging,
      setResizing: state.setResizing,
      setCurrentStep: state.setCurrentStep,
    })),
  );

  const handleBack = () => {
    setCurrentStep("signers");
    setSelectedFieldId("");
  };

  const handleNext = () => {
    setSelectedFieldId("");
    onStepComplete();
  };

  if (!documentDataUrl) {
    return (
      <div className="container mx-auto flex h-[calc(100vh-240px)] items-center justify-center">
        <p>Loading document...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-4">
      <div className="flex h-[calc(100vh-240px)] overflow-hidden rounded-lg border bg-background shadow-md">
        <div className="relative flex-1 overflow-hidden rounded-l-lg">
          <DocumentCanvas
            documentDataUrl={documentDataUrl}
            numPages={numPages}
            setNumPages={setNumPages}
            scale={scale}
            fields={fields}
            updateField={updateField}
            addField={addField}
            signers={signers}
            selectedFieldId={selectedFieldId}
            setSelectedFieldId={setSelectedFieldId}
            viewType={viewType}
            isDragging={isDragging}
            isResizing={isResizing}
            setDragging={setDragging}
            setResizing={setResizing}
          />
        </div>

        <div className="w-96 border-l">
          {viewType === "editor" ? (
            <FieldsPalette />
          ) : (
            <FieldsList viewType={viewType} />
          )}
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
