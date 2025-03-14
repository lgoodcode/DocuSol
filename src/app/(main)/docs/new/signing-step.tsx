"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Pencil,
  Calendar,
  Check,
  Trash2,
  Plus,
  User,
  ChevronRight,
  Move,
} from "lucide-react";

import { useDocumentStore, DocumentField } from "./useDocumentStore";
// import { SignerRole } from "@/lib/types/stamp";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SigningStep({
  onStepComplete,
}: {
  onStepComplete: () => void;
}) {
  const {
    documentPreviewUrl,
    signers,
    fields,
    addField,
    removeField,
    updateField,
    setCurrentStep,
  } = useDocumentStore();

  const [activeTab, setActiveTab] = useState("fields");
  const [selectedFieldType, setSelectedFieldType] =
    useState<DocumentField["type"]>("signature");
  const [selectedSigner, setSelectedSigner] = useState<number>(-1);
  const [isFieldRequired, setIsFieldRequired] = useState(true);
  const [fieldLabel, setFieldLabel] = useState("");
  const documentRef = useRef<HTMLDivElement>(null);
  const [draggingField, setDraggingField] = useState<string | null>(null);
  const [mockDocumentLoaded, setMockDocumentLoaded] = useState(false);

  // Mock document loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setMockDocumentLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle field addition
  const handleAddField = () => {
    if (!documentRef.current) return;

    // Get random position within the document preview area
    const rect = documentRef.current.getBoundingClientRect();
    const x = Math.random() * (rect.width - 100) + 50;
    const y = Math.random() * (rect.height - 100) + 50;

    // Add the field to the store
    addField({
      type: selectedFieldType,
      page: 1, // Assuming first page
      x,
      y,
      width: selectedFieldType === "signature" ? 150 : 100,
      height: selectedFieldType === "signature" ? 50 : 30,
      required: isFieldRequired,
      label: fieldLabel || undefined,
      assignedTo: selectedSigner,
    });

    // Reset field label
    setFieldLabel("");
  };

  // Handle field deletion
  const handleDeleteField = (id: string) => {
    removeField(id);
  };

  // Handle field dragging
  const handleDragStart = (id: string) => {
    setDraggingField(id);
  };

  const handleDragEnd = (e: React.MouseEvent, id: string) => {
    if (!documentRef.current || !draggingField) return;

    const rect = documentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update field position
    updateField(id, {
      x: Math.max(0, Math.min(x, rect.width - 100)),
      y: Math.max(0, Math.min(y, rect.height - 50)),
    });

    setDraggingField(null);
  };

  // Handle navigation to previous step
  const handleBack = () => {
    setCurrentStep("signers");
  };

  // Handle navigation to next step
  const handleNext = () => {
    setCurrentStep("review");
    onStepComplete();
  };

  // Get field type display name
  const getFieldTypeName = (type: DocumentField["type"]) => {
    switch (type) {
      case "signature":
        return "Signature";
      case "text":
        return "Text";
      case "date":
        return "Date";
      case "checkbox":
        return "Checkbox";
      default:
        return type;
    }
  };

  // Get field type icon
  const getFieldTypeIcon = (type: DocumentField["type"]) => {
    switch (type) {
      case "signature":
        return <Pencil className="h-3 w-3" />;
      case "text":
        return <FileText className="h-3 w-3" />;
      case "date":
        return <Calendar className="h-3 w-3" />;
      case "checkbox":
        return <Check className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Get signer name by index
  const getSignerName = (index?: number) => {
    if (index === undefined) return "Unassigned";
    return (
      signers[index]?.name || signers[index]?.email || `Signer ${index + 1}`
    );
  };

  // Get signer color by index for visual distinction
  const getSignerColor = (index?: number) => {
    if (index === undefined) return "bg-gray-200 dark:bg-gray-700";
    const colors = [
      "bg-blue-100 dark:bg-blue-900",
      "bg-green-100 dark:bg-green-900",
      "bg-yellow-100 dark:bg-yellow-900",
      "bg-purple-100 dark:bg-purple-900",
      "bg-pink-100 dark:bg-pink-900",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Add Fields to Document</h1>
          <p className="text-muted-foreground">
            Add signature, text, date, and checkbox fields to your document.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Document Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={documentRef}
                className="relative min-h-[600px] w-full rounded-md border bg-white dark:bg-gray-800"
              >
                {/* Mock document preview */}
                {documentPreviewUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center opacity-50">
                    <Image
                      src={documentPreviewUrl}
                      alt="Document preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {mockDocumentLoaded ? (
                      <div className="w-full max-w-md p-8">
                        <div className="mb-8 h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="mb-4 h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="mb-4 h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="mb-4 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="mb-8 h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700"></div>

                        <div className="mb-4 h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="mb-4 h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="mb-8 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>

                        <div className="mb-4 h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="mb-4 h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                        <p className="mt-2 text-muted-foreground">
                          Loading document preview...
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Render fields */}
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className={`absolute flex cursor-move flex-col items-center justify-center rounded-md border-2 border-dashed p-2 ${
                      draggingField === field.id
                        ? "border-primary bg-primary/20"
                        : `border-primary/70 ${getSignerColor(field.assignedTo)}`
                    }`}
                    style={{
                      left: `${field.x}px`,
                      top: `${field.y}px`,
                      width: `${field.width}px`,
                      height: `${field.height}px`,
                      zIndex: draggingField === field.id ? 10 : 1,
                    }}
                    onMouseDown={() => handleDragStart(field.id)}
                    onMouseUp={(e) => handleDragEnd(e, field.id)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {getFieldTypeName(field.type)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 cursor-move"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Move className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteField(field.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {field.label && (
                      <span className="mt-1 text-xs">{field.label}</span>
                    )}
                    <span className="mt-1 text-xs text-muted-foreground">
                      {getSignerName(field.assignedTo)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Field Controls */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="assigned">Assigned Fields</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-type">Field Type</Label>
                    <Select
                      value={selectedFieldType}
                      onValueChange={(value) =>
                        setSelectedFieldType(value as DocumentField["type"])
                      }
                    >
                      <SelectTrigger id="field-type">
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="signature">Signature</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field-label">Field Label (Optional)</Label>
                    <Input
                      id="field-label"
                      placeholder="Enter field label"
                      value={fieldLabel}
                      onChange={(e) => setFieldLabel(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned-to">Assign To</Label>
                    <Select
                      value={
                        selectedSigner !== -1 ? String(selectedSigner) : "-1"
                      }
                      onValueChange={(value) =>
                        setSelectedSigner(parseInt(value))
                      }
                    >
                      <SelectTrigger id="assigned-to">
                        <SelectValue placeholder="Select signer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-1">Unassigned</SelectItem>
                        {signers.map((signer, index) => (
                          <SelectItem key={index} value={String(index)}>
                            {signer.name || signer.email}
                            {signer.isMyself && " (You)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="required-field"
                      checked={isFieldRequired}
                      onCheckedChange={(checked) =>
                        setIsFieldRequired(!!checked)
                      }
                    />
                    <Label htmlFor="required-field">Required Field</Label>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleAddField}
                    disabled={signers.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>

                  {signers.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      You need to add signers before adding fields.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assigned" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assigned Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  {signers.length > 0 ? (
                    <div className="space-y-4">
                      {signers.map((signer, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {signer.name || signer.email}
                              {signer.isMyself && " (You)"}
                            </span>
                          </div>
                          <div className="ml-6 space-y-1">
                            {fields.filter((f) => f.assignedTo === index)
                              .length > 0 ? (
                              fields
                                .filter((f) => f.assignedTo === index)
                                .map((field) => (
                                  <div
                                    key={field.id}
                                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      {getFieldTypeIcon(field.type)}
                                      <span>
                                        {field.label ||
                                          getFieldTypeName(field.type)}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() =>
                                        handleDeleteField(field.id)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No fields assigned
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No signers added yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button onClick={handleNext} disabled={fields.length === 0}>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                {fields.length === 0 && (
                  <TooltipContent>
                    <p>Add at least one field to continue</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
