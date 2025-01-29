"use client";

import {
  FileText,
  Calendar,
  Hash,
  Key,
  File,
  PenTool,
  Clock,
  ExternalLink,
} from "lucide-react";

import type { Document } from "@/lib/supabase/types";
import { hexToBuffer, previewBlob } from "@/lib/utils";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { BlobPreview } from "@/components/file-preview";

type DocumentField = {
  icon: React.ReactNode;
  label: string;
  value: string;
  canCopy?: boolean;
  binary?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatValue = (value: any) => {
  if (value === null || value === undefined) return "Not available";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value.toString();
};

export function DocumentDetails({ document }: { document: Document }) {
  const fields: DocumentField[] = [
    {
      icon: <Hash className="h-4 w-4" />,
      label: "Document ID",
      value: formatValue(document.id),
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Name",
      value: formatValue(document.name),
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Password",
      value: document.password ? "Set" : "Not set",
    },
    {
      icon: <File className="h-4 w-4" />,
      label: "Original Filename",
      value: formatValue(document.original_filename),
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "MIME Type",
      value: formatValue(document.mime_type),
    },
    {
      icon: <Hash className="h-4 w-4" />,
      label: "Unsigned Hash",
      value: formatValue(document.unsigned_hash),
      canCopy: true,
    },
    {
      icon: <Hash className="h-4 w-4" />,
      label: "Signed Hash",
      value: formatValue(document.signed_hash),
      canCopy: true,
    },
    {
      icon: <Key className="h-4 w-4" />,
      label: "Unsigned Transaction",
      value: formatValue(document.unsigned_transaction_signature),
      canCopy: true,
    },
    {
      icon: <Key className="h-4 w-4" />,
      label: "Signed Transaction",
      value: formatValue(document.signed_transaction_signature),
      canCopy: true,
    },
    {
      icon: <File className="h-4 w-4" />,
      label: "Original Document",
      value: formatValue(document.original_document),
      binary: true,
    },
    {
      icon: <File className="h-4 w-4" />,
      label: "Unsigned Document",
      value: formatValue(document.unsigned_document),
      binary: true,
    },
    {
      icon: <File className="h-4 w-4" />,
      label: "Signed Document",
      value: formatValue(document.signed_document),
      binary: true,
    },
    {
      icon: <PenTool className="h-4 w-4" />,
      label: "Signed Status",
      value: formatValue(document.is_signed),
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "Signed At",
      value: document.signed_at
        ? new Date(document.signed_at).toLocaleString()
        : "Not signed",
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Created At",
      value: new Date(document.created_at).toLocaleString(),
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Updated At",
      value: new Date(document.updated_at).toLocaleString(),
    },
  ];

  const handleViewDocument = (value: string) => () => {
    const rawData = hexToBuffer(value);
    previewBlob(new Blob([rawData], { type: document.mime_type }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {fields.map((field, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex flex-row items-center">
                {field.icon}
                <h2 className="ml-2 mr-1">{field.label}</h2>
                {field?.canCopy && field.value !== "Not available" && (
                  <CopyButton value={field.value} />
                )}
              </div>
              <div className="flex flex-col">
                {field.binary && field.value !== "Not available" ? (
                  <div className="flex flex-col justify-center items-center gap-2">
                    <BlobPreview
                      hexValue={field.value}
                      mimeType={document.mime_type}
                    />
                    <button
                      onClick={handleViewDocument(field.value)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                      aria-label="View document"
                    >
                      View in new tab
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm md:text-base text-muted-foreground break-all">
                    {field.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
