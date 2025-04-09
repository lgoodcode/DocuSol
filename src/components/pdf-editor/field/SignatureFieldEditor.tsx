import { useRef, useState, useEffect, memo, useCallback } from "react";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { Eraser, Trash2, Undo, Minus, Plus } from "lucide-react";

import { signatureFonts } from "@/app/styles/fonts";
import { useField } from "@/lib/pdf-editor/hooks/useField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocumentField } from "@/lib/pdf-editor/document-types";

interface SignatureFieldEditorProps {
  field: DocumentField;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Constants for font size limits
const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 72;
const DEFAULT_FONT_SIZE = 32; // Default for preview/input

/**
 * Loads an existing signature image (data URL) onto the canvas.
 * Adjusts the image to fit the canvas while maintaining aspect ratio.
 *
 * @param field - The document field containing the value.
 * @param sigCanvasRef - Ref to the SignatureCanvas component.
 * @param setHasSignature - State setter to indicate if the canvas has content.
 */
const loadExistingSignature = (
  field: DocumentField,
  sigCanvasRef: React.RefObject<SignatureCanvas | null>,
  setHasSignature: (hasSignature: boolean) => void,
) => {
  if (
    field.value &&
    field.value.startsWith("data:image") &&
    sigCanvasRef.current
  ) {
    const sigCanvas = sigCanvasRef.current;
    const img = new Image();
    img.crossOrigin = "anonymous"; // Avoid potential cross-origin issues with data URLs

    img.onload = () => {
      const canvas = sigCanvas.getCanvas(); // Get the underlying canvas element
      if (!canvas) {
        console.error("Failed to get underlying canvas element.");
        setHasSignature(false);
        return;
      }

      // Clear previous content before drawing
      sigCanvas.clear();

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Get the actual drawing buffer dimensions
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Calculate aspect ratios to draw image centered and scaled
        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        let drawWidth = canvasWidth;
        let drawHeight = canvasHeight;

        if (imgAspectRatio > canvasAspectRatio) {
          // Image is wider than canvas proportionally
          drawHeight = canvasWidth / imgAspectRatio;
        } else {
          // Image is taller than canvas proportionally or aspect ratios are equal
          drawWidth = canvasHeight * imgAspectRatio;
        }

        // Center the image
        const offsetX = (canvasWidth - drawWidth) / 2;
        const offsetY = (canvasHeight - drawHeight) / 2;

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        setHasSignature(true); // Canvas now has content
      } else {
        console.error("Failed to get 2D context from signature canvas.");
        setHasSignature(false);
      }
    };

    img.onerror = () => {
      console.error("Failed to load existing signature image from data URL.");
      toast.error("Could not load existing signature.");
      setHasSignature(false);
    };

    img.src = field.value; // Start loading the image
  } else {
    // Ensure state is false if no image or canvas isn't ready
    setHasSignature(false);
  }
};

/**
 * Renders a dialog for creating or editing a signature or initials field.
 * Allows users to type text with different fonts or draw their signature.
 */
export const SignatureFieldEditor = memo(function SignatureFieldEditor({
  field,
  open,
  onOpenChange,
}: SignatureFieldEditorProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const { updateField } = useField(field.id);

  // Determine initial state based on field properties
  const initialIsDraw = field.value?.startsWith("data:image") ?? false;
  const initialInputValue = !initialIsDraw ? (field.value ?? "") : "";
  const initialFont =
    field.textStyles?.fontFamily || signatureFonts[0]?.fontFamily || "cursive";
  const initialFontSize = field.textStyles?.fontSize || DEFAULT_FONT_SIZE;

  const [activeTab, setActiveTab] = useState<"type" | "draw">(
    initialIsDraw ? "draw" : "type",
  );
  const [hasSignature, setHasSignature] = useState(initialIsDraw);
  const [inputValue, setInputValue] = useState(initialInputValue);
  const [selectedFont, setSelectedFont] = useState(initialFont);
  const [fontSize, setFontSize] = useState(initialFontSize);

  // --- Effects ---

  // Load existing signature image when dialog opens and is in draw mode initially or switches to draw
  useEffect(() => {
    if (open && activeTab === "draw" && field.value?.startsWith("data:image")) {
      // Use a small timeout to ensure the canvas element is mounted and sized correctly
      // before attempting to draw the image onto it.
      const timer = setTimeout(() => {
        loadExistingSignature(field, sigCanvasRef, setHasSignature);
      }, 100); // Adjust delay if needed

      return () => clearTimeout(timer); // Cleanup timeout
    } else if (!open) {
      // Optional: Reset state when dialog closes if needed
      // setHasSignature(initialIsDraw);
    }
    // Re-run if dialog opens, tab changes to 'draw', or the image value changes
  }, [open, activeTab, field.value]);

  // Synchronize state from field changes (e.g., external updates)
  useEffect(() => {
    const isDraw = field.value?.startsWith("data:image") ?? false;
    setInputValue(isDraw ? "" : (field.value ?? ""));
    setSelectedFont(
      field.textStyles?.fontFamily ||
        signatureFonts[0]?.fontFamily ||
        "cursive",
    );
    setFontSize(field.textStyles?.fontSize || DEFAULT_FONT_SIZE); // Sync font size
    setActiveTab(isDraw ? "draw" : "type");
  }, [field.value, field.textStyles?.fontFamily, field.textStyles?.fontSize]); // Added fontSize dependency

  // --- Font Size Actions ---
  const decreaseFontSize = useCallback(() => {
    setFontSize((currentSize) => Math.max(MIN_FONT_SIZE, currentSize - 2));
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSize((currentSize) => Math.min(MAX_FONT_SIZE, currentSize + 2));
  }, []);

  // --- Canvas Actions ---

  const clearSignature = useCallback(() => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setHasSignature(false);
    }
  }, []);

  const undoSignature = useCallback(() => {
    if (sigCanvasRef.current) {
      const data = sigCanvasRef.current.toData();
      if (data.length > 0) {
        data.pop(); // Remove last stroke
        sigCanvasRef.current.fromData(data);
        setHasSignature(data.length > 0);
      } else {
        setHasSignature(false); // Ensure state is false if canvas becomes empty
      }
    }
  }, []);

  // --- Persistence Actions ---

  // Define handleDelete first as handleSave depends on it
  const handleDelete = useCallback(() => {
    updateField({
      id: field.id,
      value: undefined,
      textStyles: undefined,
    });
    toast.success(
      `${field.type === "signature" ? "Signature" : "Initials"} cleared`,
    );
    // Reset local state after clearing
    setInputValue("");
    clearSignature();
    setSelectedFont(signatureFonts[0]?.fontFamily || "cursive");
    setFontSize(DEFAULT_FONT_SIZE);
    setActiveTab("type");
    onOpenChange(false);
  }, [updateField, field.id, field.type, onOpenChange, clearSignature]);

  const handleSave = useCallback(() => {
    let valueToSave: string | undefined = undefined;
    let textStylesToSave: { fontFamily?: string; fontSize?: number } = {};

    if (activeTab === "type") {
      if (inputValue.trim()) {
        valueToSave = inputValue.trim();
        textStylesToSave = {
          fontFamily: selectedFont,
          fontSize: fontSize,
        };
      }
    } else {
      if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
        valueToSave = sigCanvasRef.current.toDataURL("image/png");
        textStylesToSave = {};
      }
    }

    if (valueToSave !== undefined) {
      updateField({
        id: field.id,
        value: valueToSave,
        textStyles: textStylesToSave,
      });
      onOpenChange(false);
    } else {
      handleDelete(); // Call handleDelete if saving empty state
    }
  }, [
    activeTab,
    inputValue,
    selectedFont,
    fontSize,
    updateField,
    field.id,
    onOpenChange,
    handleDelete, // Now handleDelete is defined above
  ]);

  // --- Render ---

  const fieldTypeName =
    field.type.charAt(0).toUpperCase() + field.type.slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{fieldTypeName} Field</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "type" | "draw")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="draw">Draw</TabsTrigger>
            </TabsList>

            {/* --- Type Tab --- */}
            <TabsContent value="type" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature-font">Select Font Style</Label>
                <Select value={selectedFont} onValueChange={setSelectedFont}>
                  <SelectTrigger id="signature-font">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    {signatureFonts.map((font) => (
                      <SelectItem
                        key={font.fontFamily}
                        value={font.fontFamily}
                        className="text-lg"
                        style={{ fontFamily: font.fontFamily }}
                      >
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size Toolbar */}
              <div className="space-y-2">
                <Label>Font Size</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decreaseFontSize}
                    disabled={fontSize <= MIN_FONT_SIZE}
                    aria-label="Decrease font size"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-sm tabular-nums">
                    {fontSize}px
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={increaseFontSize}
                    disabled={fontSize >= MAX_FONT_SIZE}
                    aria-label="Increase font size"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Input Field */}
              <div className="space-y-2">
                <Label htmlFor="signature-input">Type your {field.type}</Label>
                <Input
                  id="signature-input"
                  className="h-auto resize-none overflow-hidden py-2 text-lg leading-tight" // Use standard text size for input
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Your ${field.type}`}
                />
              </div>

              {/* Preview Area */}
              <div className="flex min-h-[100px] items-center justify-center rounded-md border p-4">
                {inputValue ? (
                  <p
                    // Apply dynamic font size and family ONLY to preview
                    style={{
                      fontFamily: selectedFont,
                      fontSize: `${fontSize}px`,
                    }}
                    className="overflow-hidden text-center"
                  >
                    {inputValue}
                  </p>
                ) : (
                  <p className="select-none text-sm text-muted-foreground">
                    Your {field.type} will appear here
                  </p>
                )}
              </div>
            </TabsContent>

            {/* --- Draw Tab --- */}
            <TabsContent value="draw" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label>Draw your {field.type}</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={undoSignature}
                    aria-label="Undo last stroke"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearSignature}
                    aria-label="Clear canvas"
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="rounded-md border bg-white">
                {/* Use theme background */}
                <SignatureCanvas
                  ref={sigCanvasRef}
                  canvasProps={{
                    className: "w-full h-[150px] cursor-crosshair rounded-md", // Added rounded-md
                    style: {
                      // CSS handles the visual sizing
                      width: "100%",
                      height: "150px",
                      // No background color here, handled by parent div
                    },
                    // Explicitly set drawing buffer size to prevent scaling issues
                    // Use dimensions matching CSS height and reasonable width for dialog
                    width: 400, // Adjust if dialog width changes significantly
                    height: 150,
                  }}
                  backgroundColor="transparent" // Export with transparency
                  penColor="black" // Pen color
                  onBegin={() => setHasSignature(true)} // Set flag when drawing starts
                  onEnd={() => {
                    // Update hasSignature based on actual content after stroke ends
                    if (sigCanvasRef.current) {
                      setHasSignature(!sigCanvasRef.current.isEmpty());
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {fieldTypeName} will have a transparent background when saved.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* --- Footer Actions --- */}
        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-1"
              aria-label="Clear signature"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                aria-label="Cancel editing"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  activeTab === "draw" ? !hasSignature : !inputValue.trim()
                } // Disable save if no content
                aria-label="Save signature"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
