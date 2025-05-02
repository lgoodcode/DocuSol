import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Italic,
  Underline,
  ChevronDown,
  X,
  RefreshCw,
  Settings,
  Minus,
  Plus,
} from "lucide-react";

import { useField } from "@/lib/pdf-editor/hooks/useField";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DocumentField } from "@/lib/pdf-editor/document-types";

// Font families
const fontFamilies = [
  { name: "Default", value: "inherit" },
  { name: "Helvetica", value: "Helvetica, sans-serif" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Times New Roman", value: "Times New Roman, serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Courier New", value: "Courier New, monospace" },
  { name: "Verdana", value: "Verdana, sans-serif" },
];

// Font colors
const fontColors = [
  { name: "Black", value: "#000000" },
  { name: "Dark Gray", value: "#444444" },
  { name: "Gray", value: "#888888" },
  { name: "Light Gray", value: "#cccccc" },
  { name: "White", value: "#ffffff" },
  { name: "Red", value: "#cc0000" },
  { name: "Dark Red", value: "#990000" },
  { name: "Orange", value: "#ff6600" },
  { name: "Yellow", value: "#ffcc00" },
  { name: "Green", value: "#00cc00" },
  { name: "Dark Green", value: "#006600" },
  { name: "Blue", value: "#0066cc" },
  { name: "Dark Blue", value: "#003366" },
  { name: "Purple", value: "#6600cc" },
];

const getFieldElement = (fieldId: string) => {
  const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
  if (!fieldElement) {
    throw new Error(`Field with id ${fieldId} not found`);
  }
  return fieldElement;
};

interface TextFormatToolbarProps {
  field: DocumentField;
  onClose?: () => void;
  viewType: "editor" | "signer";
}

export const TextFormatToolbar = ({
  field,
  onClose,
  viewType,
}: TextFormatToolbarProps) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { updateField, scale } = useField(field.id, viewType);
  const [mounted, setMounted] = useState(false);
  const [refElement, setRefElement] = useState<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!toolbarRef.current) return;
    setRefElement(toolbarRef.current);
  }, [mounted, toolbarRef, toolbarRef.current]);

  useEffect(() => {
    if (!refElement) return;
    // Get the field element and its position
    const fieldElement = getFieldElement(field.id);
    const fieldRect = fieldElement.getBoundingClientRect();

    // Calculate absolute position in viewport
    const absoluteTop = fieldRect.top + window.scrollY;
    const absoluteLeft = fieldRect.left + window.scrollX;

    setPosition({
      top: absoluteTop - (refElement.offsetHeight + 8), // 8px spacing
      left: absoluteLeft,
    });
  }, [field.id, refElement]);

  // Update font family
  const handleFontFamilyChange = (fontFamily: string) => {
    updateField({
      id: field.id,
      textStyles: {
        fontFamily,
      },
    });
  };

  // Update font size - increment or decrement
  const handleFontSizeChange = (type: "increment" | "decrement") => {
    updateField({
      id: field.id,
      textStyles: {
        fontSize:
          type === "increment"
            ? (field.textStyles?.fontSize || 12) + 2
            : (field.textStyles?.fontSize || 12) - 2,
      },
    });
  };

  // Update font color
  const handleFontColorChange = (fontColor: string) => {
    updateField({
      id: field.id,
      textStyles: {
        fontColor,
      },
    });
  };

  // Toggle bold
  const toggleBold = () => {
    updateField({
      id: field.id,
      textStyles: {
        fontWeight:
          field.textStyles?.fontWeight === "bold" ? "inherit" : "bold",
      },
    });
  };

  // Toggle italic
  const toggleItalic = () => {
    updateField({
      id: field.id,
      textStyles: {
        fontStyle:
          field.textStyles?.fontStyle === "italic" ? "inherit" : "italic",
      },
    });
  };

  // Toggle underline
  const toggleUnderline = () => {
    updateField({
      id: field.id,
      textStyles: {
        textDecoration:
          field.textStyles?.textDecoration === "underline"
            ? "inherit"
            : "underline",
      },
    });
  };

  // // Set text alignment
  // const handleTextAlign = (textAlign: string) => {
  //   updateField({
  //     id: field.id,
  //     textStyles: {
  //       textAlign,
  //     },
  //   });
  // };

  // // Update letter spacing
  // const handleLetterSpacingChange = (value: number) => {
  //   updateField({
  //     id: field.id,
  //     textStyles: {
  //       letterSpacing: value,
  //     },
  //   });
  // };

  // Reset formatting
  const resetFormatting = () => {
    updateField({
      id: field.id,
      textStyles: {
        fontFamily: undefined,
        fontSize: undefined,
        fontColor: undefined,
        fontWeight: undefined,
        fontStyle: undefined,
        textDecoration: undefined,
        // textAlign: undefined,
        // letterSpacing: undefined,
      },
    });
  };

  // Only render in browser, not during SSR
  if (!mounted) return null;

  const toolbarContent = (
    <div
      ref={toolbarRef}
      id="text-format-toolbar"
      className="fixed z-50 flex items-center rounded-md border bg-background p-1 shadow-md dark:bg-background dark:text-white"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-0.5">
          {/* Font Family Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <DropdownMenuTrigger>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1.5 text-xs"
                  >
                    <span className="max-w-16 truncate">
                      {fontFamilies.find(
                        (f) => f.value === field.textStyles?.fontFamily,
                      )?.name || "Font"}
                    </span>
                    <ChevronDown className="ml-0.5 h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="dark:bg-background dark:text-white"
                >
                  Font Family
                </TooltipContent>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {fontFamilies.map((font) => (
                  <DropdownMenuItem
                    key={font.value}
                    onClick={() => handleFontFamilyChange(font.value)}
                    style={{ fontFamily: font.value }}
                    className="text-xs"
                  >
                    {font.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </Tooltip>
          </DropdownMenu>

          {/* Text Formatting */}
          <div className="flex">
            {/* Font size smaller */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleFontSizeChange("decrement")}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="dark:bg-background dark:text-white"
              >
                Smaller
              </TooltipContent>
            </Tooltip>

            {/* Font size larger */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleFontSizeChange("increment")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="dark:bg-background dark:text-white"
              >
                Larger
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    field.textStyles?.fontWeight === "bold"
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={toggleBold}
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="dark:bg-background dark:text-white"
              >
                Bold
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    field.textStyles?.fontStyle === "italic"
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={toggleItalic}
                >
                  <Italic className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="dark:bg-background dark:text-white"
              >
                Italic
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    field.textStyles?.textDecoration === "underline"
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={toggleUnderline}
                >
                  <Underline className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="dark:bg-background dark:text-white"
              >
                Underline
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Alignment Dropdown */}
          {/* <DropdownMenu>
            <Tooltip>
              <DropdownMenuTrigger>
                <TooltipTrigger>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    {field.textStyles?.textAlign === "center" ? (
                      <AlignCenter className="h-3.5 w-3.5" />
                    ) : field.textStyles?.textAlign === "right" ? (
                      <AlignRight className="h-3.5 w-3.5" />
                    ) : field.textStyles?.textAlign === "justify" ? (
                      <AlignJustify className="h-3.5 w-3.5" />
                    ) : (
                      <AlignLeft className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="dark:bg-background dark:text-white"
                >
                  Alignment
                </TooltipContent>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-[8rem]"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem
                  onClick={() => handleTextAlign("left")}
                  className="gap-2"
                >
                  <AlignLeft className="h-3.5 w-3.5" /> Left
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTextAlign("center")}
                  className="gap-2"
                >
                  <AlignCenter className="h-3.5 w-3.5" /> Center
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTextAlign("right")}
                  className="gap-2"
                >
                  <AlignRight className="h-3.5 w-3.5" /> Right
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTextAlign("justify")}
                  className="gap-2"
                >
                  <AlignJustify className="h-3.5 w-3.5" /> Justify
                </DropdownMenuItem>
              </DropdownMenuContent>
            </Tooltip>
          </DropdownMenu> */}

          {/* Advanced Options Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <DropdownMenuTrigger>
                <TooltipTrigger>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="dark:bg-background dark:text-white"
                >
                  Advanced Options
                </TooltipContent>
              </DropdownMenuTrigger>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-60">
              {/* Font Color */}
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Text Color
              </div>
              <div className="grid grid-cols-7 gap-1 p-2">
                {fontColors.map((color) => (
                  <div
                    key={color.value}
                    className={`h-6 w-6 cursor-pointer rounded-sm border transition-transform hover:scale-110 ${field.textStyles?.fontColor === color.value ? "ring-2 ring-primary" : ""}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleFontColorChange(color.value)}
                    title={color.name}
                  />
                ))}
              </div>

              <DropdownMenuSeparator />

              {/* Letter Spacing */}
              {/* <div className="px-2 py-1 text-xs text-muted-foreground">
                Letter Spacing
              </div>
              <div className="space-y-2 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">
                    {field.textStyles?.letterSpacing || 0}px
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      handleLetterSpacingChange(
                        Math.max(
                          -2,
                          (field.textStyles?.letterSpacing || 0) - 0.5,
                        ),
                      )
                    }
                  >
                    -
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1"
                    onClick={() => handleLetterSpacingChange(0)}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      handleLetterSpacingChange(
                        Math.min(
                          10,
                          (field.textStyles?.letterSpacing || 0) + 0.5,
                        ),
                      )
                    }
                  >
                    +
                  </Button>
                </div>
              </div> */}

              <DropdownMenuSeparator />

              {/* Reset Formatting */}
              <DropdownMenuItem
                onClick={resetFormatting}
                className="justify-center gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reset Formatting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close Button */}
          {onClose && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-0.5 h-7 w-7 p-0"
                  onClick={onClose}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Close</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );

  return createPortal(toolbarContent, document.body);
};
