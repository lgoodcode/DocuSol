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

import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
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
import { DocumentField } from "@/lib/pdf-editor/document-types";
import { DocumentCanvas } from "@/components/pdf-editor/DocumentCanvas";
import { FieldsList } from "@/components/pdf-editor/FieldsList";
import { FieldsPalette } from "@/components/pdf-editor/FieldsPalette";

export function EditingStep({
  onStepComplete,
}: {
  onStepComplete: () => void;
}) {
  const {
    documentPreviewUrl,
    viewType,
    documentDataUrl: documentFileUrl,
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
  const [draggingField, setDraggingField] = useState<string | null>(null);
  const [mockDocumentLoaded, setMockDocumentLoaded] = useState(false);

  const handleBack = () => {
    setCurrentStep("signers");
  };

  const handleNext = () => {
    setCurrentStep("review");
    onStepComplete();
  };

  // Check if there's a document to display
  if (!documentFileUrl) {
    return (
      <div className="container mx-auto flex max-w-4xl items-center justify-center py-12">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-center text-lg font-medium">
              No document is available to edit.
            </p>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Please upload a document first.
            </p>
            <Button onClick={() => setCurrentStep("upload")}>
              Go to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-4">
      {/* Document editor area */}
      <div className="flex h-[calc(100vh-240px)] overflow-hidden rounded-lg border bg-background shadow-md">
        <div className="relative flex-1 overflow-hidden rounded-l-lg">
          <DocumentCanvas />
        </div>

        <div className="w-96 border-l">
          {viewType === "editor" ? <FieldsPalette /> : <FieldsList />}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button type="button" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
