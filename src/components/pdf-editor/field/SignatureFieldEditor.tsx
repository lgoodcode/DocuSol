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
import { Slider } from "@/components/ui/slider";
import type { DocumentField } from "@/lib/pdf-editor/document-types";

interface SignatureFieldEditorProps {
  field: DocumentField;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewType: "editor" | "signer";
  handleBlur: () => void;
}

// Constants for font size limits
const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 72;
const DEFAULT_FONT_SIZE = 32; // Default for preview/input

// Constants for image scale limits
const MIN_IMAGE_SCALE = 0.5;
const MAX_IMAGE_SCALE = 4.0;
const DEFAULT_IMAGE_SCALE = 1.0;
const IMAGE_SCALE_STEP = 0.05;

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
  viewType,
  handleBlur,
}: SignatureFieldEditorProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const { updateField } = useField(field.id, viewType);

  // Determine initial state based on field properties
  const initialIsDraw = field.value?.startsWith("data:image") ?? false;
  const initialInputValue = !initialIsDraw ? (field.value ?? "") : "";
  const initialFont =
    field.textStyles?.fontFamily || signatureFonts[0]?.fontFamily || "cursive";
  const initialFontSize = field.textStyles?.fontSize || DEFAULT_FONT_SIZE;
  const initialSignatureScale = field.signatureScale ?? DEFAULT_IMAGE_SCALE;

  const [activeTab, setActiveTab] = useState<"type" | "draw">(
    initialIsDraw ? "draw" : "type",
  );
  const [hasSignature, setHasSignature] = useState(initialIsDraw);
  const [inputValue, setInputValue] = useState(initialInputValue);
  const [selectedFont, setSelectedFont] = useState(initialFont);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [signatureScale, setSignatureScale] = useState(initialSignatureScale);

  // Load existing signature image and scale
  useEffect(() => {
    if (open && activeTab === "draw" && field.value?.startsWith("data:image")) {
      setSignatureScale(field.signatureScale ?? DEFAULT_IMAGE_SCALE);
      const timer = setTimeout(() => {
        loadExistingSignature(field, sigCanvasRef, setHasSignature);
      }, 100);
      return () => clearTimeout(timer);
    } else if (open && activeTab === "type") {
      setSignatureScale(DEFAULT_IMAGE_SCALE);
    }
  }, [open, activeTab, field.value, field.signatureScale]);

  // Synchronize state from field changes
  useEffect(() => {
    const isDraw = field.value?.startsWith("data:image") ?? false;
    setInputValue(isDraw ? "" : (field.value ?? ""));
    setSelectedFont(
      field.textStyles?.fontFamily ||
        signatureFonts[0]?.fontFamily ||
        "cursive",
    );
    setFontSize(field.textStyles?.fontSize || DEFAULT_FONT_SIZE);
    setSignatureScale(
      isDraw
        ? (field.signatureScale ?? DEFAULT_IMAGE_SCALE)
        : DEFAULT_IMAGE_SCALE,
    );
    setActiveTab(isDraw ? "draw" : "type");
  }, [
    field.value,
    field.textStyles?.fontFamily,
    field.textStyles?.fontSize,
    field.signatureScale,
  ]);

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

  // Close the dialog - call blur first
  const handleCancel = useCallback(() => {
    handleBlur(); // Call blur first to deselect
    onOpenChange(false); // Then close the dialog
    // Reset local state
    setInputValue("");
    clearSignature();
    setSelectedFont(signatureFonts[0]?.fontFamily || "cursive");
    setFontSize(DEFAULT_FONT_SIZE);
    setSignatureScale(DEFAULT_IMAGE_SCALE);
    setActiveTab("type");
  }, [handleBlur, onOpenChange, clearSignature]);

  const handleDelete = useCallback(() => {
    // Update field explicitly sets value to undefined
    updateField({
      id: field.id,
      value: undefined,
      textStyles: undefined,
      signatureScale: undefined,
    });
    handleBlur(); // Call blur first to deselect
    onOpenChange(false); // Then close the dialog
    // No need to reset local state here, it's handled by cancel/close flow
  }, [updateField, field.id, onOpenChange, handleBlur]);

  const handleSave = useCallback(() => {
    let valueToSave: string | undefined = undefined;
    let textStylesToSave: DocumentField["textStyles"] | undefined = undefined;
    let signatureScaleToSave: number | undefined = undefined;

    if (activeTab === "type") {
      const trimmedValue = inputValue.trim();
      if (trimmedValue) {
        valueToSave = trimmedValue;
        textStylesToSave = {
          fontFamily: selectedFont,
          fontSize: fontSize,
        };
        signatureScaleToSave = undefined;
      }
    } else {
      signatureScaleToSave = signatureScale;
      if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
        valueToSave = sigCanvasRef.current.toDataURL("image/png");
        textStylesToSave = undefined;
      } else {
        valueToSave = field.value;
        textStylesToSave = field.textStyles;
      }
    }

    if (valueToSave === undefined) {
      // If trying to save empty, treat it like delete
      handleDelete();
      return;
    }

    updateField({
      id: field.id,
      value: valueToSave,
      textStyles: textStylesToSave,
      signatureScale: signatureScaleToSave,
    });

    handleBlur(); // Call blur first to deselect
    onOpenChange(false); // Then close the dialog
  }, [
    activeTab,
    inputValue,
    selectedFont,
    fontSize,
    signatureScale,
    updateField,
    field.id,
    field.value, // Add field dependencies if used in fallback
    field.textStyles, // Add field dependencies if used in fallback
    onOpenChange,
    handleDelete,
    handleBlur, // Add handleBlur dependency
  ]);

  const handleOpenChange = useCallback(
    (newOpenState: boolean) => {
      if (!newOpenState) {
        handleCancel();
      }
      onOpenChange(newOpenState);
    },
    [handleCancel, onOpenChange],
  );

  const fieldTypeName =
    field.type.charAt(0).toUpperCase() + field.type.slice(1);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent noClose className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {field.type === "initials" ? "Create Initials" : "Create Signature"}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="type">Type</TabsTrigger>
            <TabsTrigger value="draw">Draw</TabsTrigger>
          </TabsList>

          {/* Typed Signature Tab */}
          <TabsContent value="type">
            <div className="space-y-4 py-4">
              <div className="relative">
                <Input
                  id="signature-text"
                  placeholder={
                    field.type === "initials" ? "Initials" : "Your Name"
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  style={{
                    fontFamily: selectedFont,
                    fontSize: `${fontSize}px`,
                  }}
                  className="h-24 text-4xl"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Select value={selectedFont} onValueChange={setSelectedFont}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {signatureFonts.map((font) => (
                      <SelectItem key={font.name} value={font.fontFamily}>
                        <span style={{ fontFamily: font.fontFamily }}>
                          {font.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decreaseFontSize}
                    disabled={fontSize <= MIN_FONT_SIZE}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center text-sm">{fontSize}px</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={increaseFontSize}
                    disabled={fontSize >= MAX_FONT_SIZE}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Drawn Signature Tab */}
          <TabsContent value="draw">
            <div className="space-y-4 py-4">
              <div className="mb-2 flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undoSignature}
                  title="Undo"
                  disabled={!hasSignature}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSignature}
                  title="Clear"
                  disabled={!hasSignature}
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative w-full rounded-md border bg-white">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="black"
                  canvasProps={{
                    className: "w-full h-[200px]",
                  }}
                  onEnd={() => setHasSignature(true)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-scale">
                  Adjust Size ({Math.round(signatureScale * 100)}%)
                </Label>
                <Slider
                  id="image-scale"
                  min={MIN_IMAGE_SCALE}
                  max={MAX_IMAGE_SCALE}
                  step={IMAGE_SCALE_STEP}
                  value={[signatureScale]}
                  onValueChange={(value) => setSignatureScale(value[0])}
                  disabled={!hasSignature}
                />
                <p className="text-sm text-muted-foreground">
                  Adjust the size of the signature in the field. (Does not
                  preview here)
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter className="mt-4 flex flex-row justify-between sm:justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="flex flex-row gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Apply</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
