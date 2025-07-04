import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { fieldTemplates } from "@/lib/pdf-editor/fields";
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { FieldBlock } from "@/components/pdf-editor/field/FieldBlock";
import { FieldProperties } from "@/components/pdf-editor/FieldProperties";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FieldsPalette() {
  const { signers, selectedFieldId, currentSignerId, setCurrentSignerId } =
    useDocumentStore(
      useShallow((state) => ({
        signers: state.signers,
        selectedFieldId: state.selectedFieldId,
        currentSignerId: state.currentSignerId,
        setCurrentSignerId: state.setCurrentSignerId,
      })),
    );
  // There should always be at least one signer
  const currentSigner = signers.find((s) => s.id === currentSignerId)!;

  const handleSignerChange = (signerId: string) => {
    setCurrentSignerId(signerId);
  };

  // If there is no signer selected, set the current signer as the first signer in the list
  // This applies to the initial render and when the current signer is removed
  useEffect(() => {
    if (!currentSignerId) {
      setCurrentSignerId(signers[0].id);
    }
  }, [currentSignerId]);

  return (
    <div className="animate-fade-in h-full overflow-y-auto shadow-sm">
      <div className="border-b p-4">
        <h2 className="text-lg font-medium">Fields</h2>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {/* Recipient selector  */}
          <div>
            <h3 className="mb-3 text-sm uppercase tracking-wide">
              Fillable Fields For
            </h3>

            <Select value={currentSigner.id} onValueChange={handleSignerChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Recipient">
                  <div className="flex items-center">
                    <div
                      className="mr-2 h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: currentSigner.color,
                      }}
                    ></div>
                    <span>{currentSigner.name || "Select Recipient"}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {signers.map((signer) => (
                  <SelectItem key={signer.id} value={signer.id}>
                    <div className="flex w-full items-center">
                      <div
                        className="mr-2 h-3 w-3 rounded-full"
                        style={{ backgroundColor: signer.color }}
                      ></div>
                      <span>{signer.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field blocks */}
          <div className="grid grid-cols-2 gap-2">
            {fieldTemplates.map((field, index) => (
              <FieldBlock
                key={`${field.type}-${index}`}
                field={field}
                currentSignerId={currentSigner.id}
              />
            ))}
          </div>
        </div>

        {selectedFieldId && (
          <FieldProperties fieldId={selectedFieldId} signers={signers} />
        )}
      </div>
    </div>
  );
}
