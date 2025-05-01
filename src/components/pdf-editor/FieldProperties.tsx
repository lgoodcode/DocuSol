"use client";

import { useField } from "@/lib/pdf-editor/hooks/useField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocumentSigner } from "@/lib/types/stamp";

export function FieldProperties({
  fieldId,
  signers,
}: {
  fieldId: string;
  signers: DocumentSigner[];
}) {
  const { field, updateField, removeField } = useField(fieldId, "editor");
  console.log("field", field);
  if (!field || !field.type) {
    return null;
  }
  return (
    <div className="mt-8 space-y-4" key={fieldId}>
      <Separator />
      <h3 className="text-sm uppercase tracking-wide">
        {field.type} Properties
      </h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="field-label">Field Label</Label>
          <Input
            id="field-label"
            value={field.label}
            onChange={(e) => updateField({ label: e.target.value })}
            placeholder="Enter label"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="field-required" className="cursor-pointer">
            Required Field
          </Label>
          <Switch
            id="field-required"
            checked={field.required || false}
            onCheckedChange={(checked) => updateField({ required: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-signer">Assign to</Label>
          <Select
            value={field.assignedTo}
            onValueChange={(value) => updateField({ assignedTo: value })}
          >
            <SelectTrigger id="field-signer">
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              {signers.map((signer) => (
                <SelectItem key={signer.id} value={signer.id}>
                  <div className="flex items-center">
                    <div
                      className="mr-2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: signer.color }}
                    ></div>
                    <span>{signer.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="destructive" className="w-full" onClick={removeField}>
          Delete Field
        </Button>
      </div>
    </div>
  );
}
