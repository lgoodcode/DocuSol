"use client";

import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
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

  // Check if each signer has at least one required field assigned to them
  const handleNext = () => {
    const signersWithoutRequiredFields = signers.filter((signer) => {
      const signerFields = fields.filter(
        (field) => field.assignedTo === signer.id,
      );
      return !signerFields.some((field) => field.required);
    });

    if (signersWithoutRequiredFields.length > 0) {
      const signerNames = signersWithoutRequiredFields
        .map((signer) => signer.name)
        .join(", ");
      toast.error("Missing required fields", {
        description: `Please assign at least one required field to the following signers: ${signerNames}`,
      });
      return;
    }
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
      <div className="flex min-h-[calc(100vh-240px)] flex-col overflow-hidden rounded-lg border bg-background shadow-md md:flex-row">
        <div className="relative flex-1 overflow-auto rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
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

        <div className="w-full overflow-auto rounded-b-lg border-t md:w-96 md:rounded-r-lg md:rounded-bl-none md:border-l md:border-t-0">
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
        <Button
          type="button"
          onClick={handleNext}
          disabled={fields.length === 0}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
