import type React from "react";

import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { ChevronDown, Plus, Minus, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportPdfButton } from "@/components/pdf-editor/ExportPdfButton";

// Import the useUserStore
import { useUserStore } from "@/lib/pdf-editor/stores/useUserStore";

export const EditorToolbar: React.FC = () => {
  const scale = useDocumentStore((state) => state.scale);
  const setScale = useDocumentStore((state) => state.setScale);

  // Inside the EditorToolbar component, add this after the existing state declarations
  const userType = useUserStore((state) => state.userType);
  const toggleUserType = useUserStore((state) => state.toggleUserType);

  const handleZoomIn = () => {
    setScale(Math.min(2, scale + 0.1));
  };

  const handleZoomOut = () => {
    setScale(Math.max(0.5, scale - 0.1));
  };

  return (
    <div className="flex h-14 items-center justify-between border-b bg-gray-50 px-4">
      <div className="flex items-center space-x-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-1">
              <Edit className="mr-1 h-4 w-4" />
              <span className="text-sm">Editing</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Design Mode</DropdownMenuItem>
            <DropdownMenuItem>Content Mode</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export PDF Button */}
        <ExportPdfButton />
      </div>

      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1"
          onClick={toggleUserType}
        >
          <span className="text-sm">
            Mode: {userType === "creator" ? "Creator" : "Signer"}
          </span>
        </Button>
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-16 text-center text-sm">
          {Math.round(scale * 100)}%
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleZoomIn}
          disabled={scale >= 2}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
