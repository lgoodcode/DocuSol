import { useMemo } from "react";
import { Pen, Check, ChevronRight } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { useDocumentSigningStore } from "@/app/sign/[id]/useDocumentSignStore";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FieldIcon } from "@/components/pdf-editor/field/FieldIcon";
import { Button } from "@/components/ui/button";
import type {
  DocumentField,
  DocumentState,
} from "@/lib/pdf-editor/document-types";
import type { DocumentSigningState } from "@/app/sign/[id]/useDocumentSignStore";
import type { DocumentSigner } from "@/lib/types/stamp";

const ICON_SIZE = 18;

const editorSelector = (state: DocumentState) => ({
  fields: state.fields,
  signers: state.signers,
  currentSigner: null, // Not used in editor view
  selectedFieldId: state.selectedFieldId,
  setSelectedFieldId: state.setSelectedFieldId,
});

const signerSelector = (state: DocumentSigningState) => ({
  fields: state.fields, // Return the original array
  signers: null, // Not used directly, derived from currentSigner
  currentSigner: state.currentSigner,
  selectedFieldId: state.selectedFieldId,
  setSelectedFieldId: state.setSelectedFieldId,
});

type SignerFieldGroup = {
  signer: DocumentSigner;
  fields: DocumentField[];
  completedCount: number;
};

type PageFieldGroup = {
  pageNumber: number;
  signerGroups: SignerFieldGroup[];
  totalFields: number;
};

export const FieldsList: React.FC<{
  viewType: "editor" | "signer";
}> = ({ viewType }) => {
  // Call both hooks unconditionally
  const editorState = useDocumentStore(useShallow(editorSelector));
  const signerState = useDocumentSigningStore(useShallow(signerSelector));

  // Select the appropriate state based on viewType
  const {
    fields: allFields,
    signers,
    currentSigner,
    selectedFieldId,
    setSelectedFieldId,
  } = viewType === "editor"
    ? { ...editorState }
    : { ...signerState, signers: [], currentSigner: undefined }; // Provide default values for editor-specific state when in signer view

  const {
    fields: signerFields,
    currentSigner: signingSigner,
    selectedFieldId: signerSelectedFieldId,
    setSelectedFieldId: signerSetSelectedFieldId,
  } = viewType === "signer"
    ? { ...signerState }
    : {
        // Provide default values for signer-specific state when in editor view
        fields: [],
        currentSigner: undefined,
        selectedFieldId: null,
        setSelectedFieldId: () => {},
      };

  // Use the correct state variables based on viewType
  const fieldsToDisplay = viewType === "editor" ? allFields : signerFields;
  const currentSignerInfo =
    viewType === "editor" ? currentSigner : signingSigner;
  const activeSelectedFieldId =
    viewType === "editor" ? selectedFieldId : signerSelectedFieldId;
  const setActiveSelectedFieldId =
    viewType === "editor" ? setSelectedFieldId : signerSetSelectedFieldId;

  // Filter fields specifically for the signer view *after* getting them from the store
  const fields = useMemo(() => {
    if (viewType == "signer" && currentSignerInfo) {
      // Filter the raw fields based on the current signer
      return fieldsToDisplay.filter(
        (f) => f.assignedTo === currentSignerInfo.id,
      );
    }
    return fieldsToDisplay; // Return all fields for editor view or if no signer
  }, [viewType, currentSignerInfo, fieldsToDisplay]);

  // Calculate completion statistics (uses the memoized 'fields' array)
  const completionStats = useMemo(() => {
    const total = fields.length;
    const totalRequired = fields.filter((field) => field.required).length;
    const completed = fields.filter((field) => !!field.value).length;
    const requiredCompleted = fields.filter(
      (field) => field.required && !!field.value,
    ).length;
    const requiredPercentage =
      totalRequired > 0
        ? Math.round((requiredCompleted / totalRequired) * 100)
        : 100;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      percentage,
      totalRequired,
      requiredCompleted,
      requiredPercentage,
    };
  }, [fields]);

  // Group fields by page and signer for organized display
  const fieldGroups = useMemo((): PageFieldGroup[] => {
    // Helper function to check if a field is completed
    const isFieldCompleted = (field: DocumentField): boolean => !!field.value;

    // Get available signers based on viewType
    const availableSigners =
      viewType === "editor"
        ? signers
        : currentSignerInfo
          ? [currentSignerInfo]
          : [];

    if (!availableSigners) {
      console.error("Signers data is missing for field grouping.");
      return [];
    }

    // Get signer by ID function adaptable for both views
    const getSignerById = (signerId: string): DocumentSigner | undefined =>
      availableSigners.find((s) => s.id === signerId);

    // Use the memoized 'fields' array, already filtered for signer view
    const relevantFields = fields;

    // Group fields by page
    const fieldsByPage = relevantFields.reduce(
      (acc, field) => {
        const pageIndex = field.position.page;
        if (!acc[pageIndex]) {
          acc[pageIndex] = [];
        }
        acc[pageIndex].push(field);
        return acc;
      },
      {} as Record<number, DocumentField[]>,
    );

    // Transform into the desired structure
    return Object.entries(fieldsByPage)
      .map(([pageIndex, pageFields]) => {
        const pageNumber = parseInt(pageIndex, 10);

        // Group fields by signer for this page
        const fieldsBySigner = pageFields.reduce(
          (acc, field) => {
            // Only include fields assigned to a known signer
            if (getSignerById(field.assignedTo)) {
              if (!acc[field.assignedTo]) {
                acc[field.assignedTo] = [];
              }
              acc[field.assignedTo].push(field);
            }
            return acc;
          },
          {} as Record<string, DocumentField[]>,
        );

        // Create signer groups with completion info
        const signerGroups = Object.entries(fieldsBySigner)
          .map(([signerId, signerFields]) => {
            const signer = getSignerById(signerId);
            if (!signer) return null; // Should not happen due to filter above

            return {
              signer,
              fields: signerFields,
              completedCount: signerFields.filter(isFieldCompleted).length,
            };
          })
          .filter((group): group is SignerFieldGroup => group !== null); // Type guard

        // Filter signer groups to ensure they belong to available signers (relevant for editor view mostly)
        const relevantSignerGroups = signerGroups.filter((group) =>
          availableSigners.some((s) => s.id === group.signer.id),
        );

        // Recalculate total fields based on filtered signer groups
        const totalRelevantFieldsOnPage = relevantSignerGroups.reduce(
          (sum, group) => sum + group.fields.length,
          0,
        );

        return {
          pageNumber,
          signerGroups: relevantSignerGroups, // Use the filtered groups
          totalFields: totalRelevantFieldsOnPage, // Use the recalculated total
        };
      })
      .filter((pageGroup) => pageGroup.totalFields > 0) // Remove pages with no relevant fields
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }, [fields, signers, currentSignerInfo, viewType]);

  // Handle field selection and scroll to it
  const handleFieldSelect = (field: DocumentField) => {
    setActiveSelectedFieldId(field.id);

    const pageElement = document.querySelector(`[data-field-id="${field.id}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  };

  // Render empty state when no relevant fields exist for the current view/signer
  if (fields.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Pen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium">
          {viewType === "editor" ? "No Fields Added" : "No Fields Assigned"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {viewType === "editor"
            ? "Add fields to the document using the tools above."
            : "There are no fields in this document assigned to you."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <CompletionHeader stats={completionStats} viewType={viewType} />
      <FieldsContent
        fieldGroups={fieldGroups}
        selectedFieldId={activeSelectedFieldId || null}
        onFieldSelect={handleFieldSelect}
      />
    </div>
  );
};

// Component for the completion statistics header
const CompletionHeader = ({
  stats,
  viewType,
}: {
  stats: {
    total: number;
    completed: number;
    percentage: number;
    totalRequired: number;
    requiredCompleted: number;
    requiredPercentage: number;
  };
  viewType: "editor" | "signer";
}) => (
  <div className="border-b p-4">
    <h2 className="text-lg font-medium">Fields to Complete</h2>
    <div className="mt-1 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {stats.completed} of {stats.total} total fields
        </p>
        <span className="text-sm font-medium">{stats.percentage}%</span>
      </div>

      {stats.totalRequired > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-destructive">
            {stats.requiredCompleted} of {stats.totalRequired} required fields
          </p>
          <span className="text-sm font-medium text-destructive">
            {stats.requiredPercentage}%
          </span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {stats.totalRequired > 0
          ? `Required fields must be completed to finalize the document.`
          : `No required fields ${viewType === "signer" ? "assigned to you " : ""}in this document.`}
      </p>
    </div>

    <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${stats.percentage}%` }}
      />
    </div>
  </div>
);

const FieldsContent = ({
  fieldGroups,
  selectedFieldId,
  onFieldSelect,
}: {
  fieldGroups: PageFieldGroup[];
  selectedFieldId: string | null;
  onFieldSelect: (field: DocumentField) => void;
}) => (
  <ScrollArea className="flex-1">
    <div className="grid gap-6 p-4">
      {fieldGroups.map((pageGroup) => (
        <PageSection
          key={`page-${pageGroup.pageNumber}`}
          pageGroup={pageGroup}
          selectedFieldId={selectedFieldId}
          onFieldSelect={onFieldSelect}
        />
      ))}
    </div>
  </ScrollArea>
);

const PageSection = ({
  pageGroup,
  selectedFieldId,
  onFieldSelect,
}: {
  pageGroup: PageFieldGroup;
  selectedFieldId: string | null;
  onFieldSelect: (field: DocumentField) => void;
}) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-medium">Page {pageGroup.pageNumber + 1}</h3>
      <span className="text-xs text-muted-foreground">
        {pageGroup.totalFields} field(s)
      </span>
    </div>

    {pageGroup.signerGroups.map((signerGroup) => (
      <SignerSection
        key={signerGroup.signer.id}
        signerGroup={signerGroup}
        selectedFieldId={selectedFieldId}
        onFieldSelect={onFieldSelect}
      />
    ))}

    <Separator className="mt-4" />
  </div>
);

const SignerSection = ({
  signerGroup,
  selectedFieldId,
  onFieldSelect,
}: {
  signerGroup: SignerFieldGroup;
  selectedFieldId: string | null;
  onFieldSelect: (field: DocumentField) => void;
}) => (
  <div className="mb-4 pl-2">
    <div className="mb-2 mt-4 flex items-center">
      <div
        className="mr-2 h-3 w-3 rounded-full"
        style={{ backgroundColor: signerGroup.signer.color }}
      />
      <span className="text-sm font-medium">{signerGroup.signer.name}</span>
      <span className="ml-auto text-xs text-muted-foreground">
        {signerGroup.completedCount}/{signerGroup.fields.length}
      </span>
    </div>

    <div className="space-y-2 pl-2">
      {signerGroup.fields.map((field) => (
        <FieldItem
          key={field.id}
          field={field}
          isSelected={field.id === selectedFieldId}
          onSelect={() => onFieldSelect(field)}
        />
      ))}
    </div>
  </div>
);

const FieldItem = ({
  field,
  isSelected,
  onSelect,
}: {
  field: DocumentField;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const isCompleted = !!field.value;

  return (
    <Button
      variant="ghost"
      className={cn(
        "h-auto w-full justify-start px-3 py-2",
        "border",
        isSelected ? "border-primary" : "border-transparent",
        isCompleted ? "opacity-70" : "opacity-100",
      )}
      onClick={onSelect}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3 flex items-center justify-center">
            {isCompleted ? (
              <Check size={ICON_SIZE} />
            ) : (
              <FieldIcon type={field.type} size={ICON_SIZE} />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="whitespace-normal break-words text-left text-sm font-medium">
              {field.label ||
                field.type.charAt(0).toUpperCase() + field.type.slice(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
            </span>
          </div>
        </div>
        <div className="ml-2 flex flex-shrink-0 items-center gap-2">
          {field.required && (
            <Badge variant="destructive" className="shrink-0">
              Required
            </Badge>
          )}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </div>
    </Button>
  );
};
