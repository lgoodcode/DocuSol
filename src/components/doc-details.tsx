"use client";

import { FileText, Calendar, Hash, PenTool, Clock } from "lucide-react";

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

const DocumentFieldItem = ({ field }: { field: DocumentField }) => (
  <div className="flex flex-col gap-2">
    <div className="flex flex-row items-center">
      {field.icon}
      <h2 className="ml-2 mr-1">{field.label}</h2>
    </div>
    <div className="flex flex-col">
      {field.binary && field.value !== "Not available" ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <BlobPreview hexValue={field.value} />
        </div>
      ) : field?.canCopy ? (
        <div className="flex items-center gap-2 rounded-md bg-muted-foreground/10 p-2 dark:bg-muted/50">
          <code className="flex-1 break-all font-mono text-xs sm:text-sm">
            {field.value}
          </code>
          <CopyButton value={field.value} />
        </div>
      ) : (
        <span className="break-all text-sm text-muted-foreground md:text-base">
          {field.value}
        </span>
      )}
    </div>
  </div>
);

export function DocumentDetails({
  document,
  partial,
}: {
  document: DocumentDetails;
  partial?: boolean;
}) {
  const fields: DocumentField[] = [
    {
      icon: <Hash className="h-4 w-4" />,
      label: "Document ID",
      value: formatValue(document.id),
      canCopy: true,
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Name",
      value: formatValue(document.name),
    },
    {
      icon: <PenTool className="h-4 w-4" />,
      label: "Signed Status",
      value: document.status === "completed" ? "Signed" : "Not signed",
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "Signed At",
      value: document.completed_at
        ? new Date(document.completed_at).toLocaleString()
        : "Not signed",
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Created At",
      value: document.created_at
        ? new Date(document.created_at).toLocaleString()
        : "Not available",
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Updated At",
      value: document.updated_at
        ? new Date(document.updated_at).toLocaleString()
        : "Not available",
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Password",
      value: document.password ? "Set" : "Not set",
    },
    // {
    //   icon: <Hash className="h-4 w-4" />,
    //   label: "Unsigned Hash",
    //   value: formatValue(document.unsigned_hash),
    //   canCopy: true,
    // },
    // {
    //   icon: <Hash className="h-4 w-4" />,
    //   label: "Signed Hash",
    //   value: formatValue(document.signed_hash),
    //   canCopy: true,
    // },
    // {
    //   icon: <Key className="h-4 w-4" />,
    //   label: "Unsigned Transaction",
    //   value: formatValue(document.unsigned_transaction_signature),
    //   canCopy: true,
    // },
    // {
    //   icon: <Key className="h-4 w-4" />,
    //   label: "Signed Transaction",
    //   value: formatValue(document.signed_transaction_signature),
    //   canCopy: true,
    // },

    // {
    //   icon: <File className="h-4 w-4" />,
    //   label: "Original Document",
    //   value: formatValue(document.original_document),
    //   binary: true,
    // },
    // {
    //   icon: <File className="h-4 w-4" />,
    //   label: "Unsigned Document",
    //   value: formatValue(document.unsigned_document),
    //   binary: true,
    // },
    // {
    //   icon: <File className="h-4 w-4" />,
    //   label: "Signed Document",
    //   value: formatValue(document.signed_document),
    //   binary: true,
    // },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <FileText className="h-5 w-5" />
          Document Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {partial &&
            fields
              .filter((field) => field.value !== "Not available")
              .map((field, index) => (
                <DocumentFieldItem key={index} field={field} />
              ))}

          {!partial &&
            fields.map((field, index) => (
              <DocumentFieldItem key={index} field={field} />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
