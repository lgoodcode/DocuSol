import { useState } from "react";
import { EditorHeader } from "./EditorHeader";
import { EditorToolbar } from "./EditorToolbar";
import { DocumentCanvas } from "./DocumentCanvas";
import { FieldsPalette } from "./FieldsPalette";
import { FieldsList } from "./FieldsList";
// import { FieldProperties } from "./FieldProperties";
import { useUserStore } from "@/lib/pdf-editor/stores/useUserStore";

export const PDFEditor: React.FC = () => {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const userType = useUserStore((state) => state.userType);

  return (
    <div className="flex h-screen flex-col">
      <EditorHeader />
      <EditorToolbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <DocumentCanvas />
        </div>

        {/* Right sidebar - conditionally render based on user type */}
        <div className="w-96 border-l">
          {userType === "creator" ? <FieldsPalette /> : <FieldsList />}
        </div>
      </div>

      {/* Field properties/editor panel (shows when a field is selected) */}
      {/* {selectedFieldId && userType === "creator" && <FieldProperties />} */}
    </div>
  );
};
