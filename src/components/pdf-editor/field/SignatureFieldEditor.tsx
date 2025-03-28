import { useRef, useState, useEffect, memo } from "react";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { Eraser, Trash2, Undo } from "lucide-react";

import { signatureFonts } from "@/app/fonts";
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

const loadExistingSignature = (
  field: DocumentField,
  sigCanvas: React.RefObject<SignatureCanvas | null>,
  setHasSignature: (hasSignature: boolean) => void,
) => {
  if (
    field.value &&
    field.value.startsWith("data:image") &&
    sigCanvas.current
  ) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = sigCanvas.current;
      if (canvas) {
        canvas.clear();
        const ctx = canvas.getCanvas().getContext("2d");
        if (ctx) {
          ctx.drawImage(
            img,
            0,
            0,
            canvas.getCanvas().width,
            canvas.getCanvas().height,
          );
          setHasSignature(true);
        }
      }
    };
    img.src = field.value;
  }
};

export const SignatureFieldEditor = memo(function SignatureFieldEditor({
  field,
  open,
  onOpenChange,
}: SignatureFieldEditorProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const { updateField } = useField(field.id);
  const [activeTab, setActiveTab] = useState<"type" | "draw">("type");
  const [hasSignature, setHasSignature] = useState(false);
  const [inputValue, setInputValue] = useState(
    field.value && !field.value.startsWith("data:image") ? field.value : "",
  );
  const [selectedFont, setSelectedFont] = useState(
    field.textStyles?.fontFamily || signatureFonts[0].fontFamily,
  );

  // Initialize canvas with existing signature if available
  useEffect(() => {
    if (
      activeTab === "draw" &&
      field.value &&
      field.value.startsWith("data:image")
    ) {
      loadExistingSignature(field, sigCanvas, setHasSignature);
    }
  }, [activeTab, field.value]);

  // Clear the signature canvas
  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setHasSignature(false);
    }
  };

  // Undo the last stroke
  const undoSignature = () => {
    if (sigCanvas.current) {
      const data = sigCanvas.current.toData();
      if (data.length > 0) {
        data.pop(); // Remove the last stroke
        sigCanvas.current.fromData(data);
        setHasSignature(data.length > 0);
      }
    }
  };

  const handleSave = () => {
    let value = "";
    let fontFamily = undefined;

    if (activeTab === "type") {
      // Save typed signature with font info
      value = inputValue;
      fontFamily = selectedFont;
    } else {
      // Save drawn signature as data URL
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        value = sigCanvas.current.toDataURL("image/png", {
          backgroundColor: "transparent",
        });
      }
    }

    updateField({
      id: field.id,
      value,
      textStyles: {
        fontFamily,
      },
    });

    toast.success(
      `${field.type === "signature" ? "Signature" : "Initials"} updated`,
    );
    onOpenChange(false);
  };

  const handleDelete = () => {
    updateField({
      id: field.id,
      value: undefined,
      textStyles: {
        fontFamily: undefined,
      },
    });
    toast.success(
      `${field.type === "signature" ? "Signature" : "Initials"} cleared`,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {field.type.charAt(0).toUpperCase() + field.type.slice(1)} Field
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs
            defaultValue="type"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "type" | "draw")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="draw">Draw</TabsTrigger>
            </TabsList>

            <TabsContent value="type" className="mt-4">
              <div className="space-y-4">
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

                <div className="space-y-2">
                  <Label htmlFor="signature-input">
                    Type your {field.type}
                  </Label>
                  <Input
                    id="signature-input"
                    className="text-lg"
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Your ${field.type}`}
                  />
                </div>

                <div className="flex min-h-[100px] items-center justify-center rounded-md border p-4">
                  {inputValue ? (
                    <p
                      className="text-3xl"
                      style={{ fontFamily: selectedFont }}
                    >
                      {inputValue}
                    </p>
                  ) : (
                    <p className="select-none text-sm text-muted-foreground">
                      Your {field.type} will appear here
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="draw" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Draw your {field.type}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={undoSignature}
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={clearSignature}
                    >
                      <Eraser className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border bg-transparent">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      className: "w-full h-[150px] cursor-crosshair",
                      style: {
                        width: "100%",
                        height: "150px",
                        // Use white background for simplicity so the signature is visible and black pen color is visible
                        backgroundColor: "white",
                      },
                    }}
                    backgroundColor="transparent"
                    penColor="black"
                    onBegin={() => setHasSignature(true)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {field.type.charAt(0).toUpperCase() + field.type.slice(1)}{" "}
                  will have a transparent background
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <div className="flex w-full justify-between">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={activeTab === "draw" ? !hasSignature : !inputValue}
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
