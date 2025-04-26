"use client";

import { useMemo, useCallback } from "react";
import { captureException } from "@sentry/nextjs";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  Download,
  Eye,
  Trash,
  Compass,
  Copy,
  Link,
  Share,
  Pencil,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { SignatureStatus } from "@/lib/types/stamp";

import type { ViewDocument } from "./types";

import {
  // viewDocument,
  viewTransaction,
  copyTxSignature,
  // copyDocumentSignUrl,
  // copyViewUrl,
  // downloadDocument,
} from "./list-docs-actions";

type ActionType = "viewTransaction" | "copyTxSignature";
// | "copyDocumentSignUrl"
// | "copyViewUrl"
// | "download";

const statusMap: Record<SignatureStatus, string> = {
  draft: "Draft",
  awaiting_signatures: "Awaiting Signatures",
  partially_signed: "Partially Signed",
  completed: "Completed",
  rejected: "Rejected",
  expired: "Expired",
};

const actionMap: Record<
  ActionType,
  (doc: ViewDocument, queryClient: QueryClient) => Promise<void | string>
> = {
  // view: viewDocument,
  viewTransaction,
  copyTxSignature,
  // copyDocumentSignUrl,
  // copyViewUrl,
  // download: downloadDocument,
} as const;

export function useColumns({
  renameDoc,
  deleteDoc,
}: {
  renameDoc: {
    docToRename: ViewDocument | null;
    setDocToRename: (doc: ViewDocument | null) => void;
  };
  deleteDoc: {
    docToDelete: ViewDocument | null;
    setDocToDelete: (doc: ViewDocument | null) => void;
  };
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createActionHandler = useCallback((actionType: ActionType) => {
    return async (doc: ViewDocument) => {
      try {
        const result = await actionMap[actionType](doc, queryClient);

        if (actionType === "copyTxSignature") {
          toast({
            title: "Copied to Clipboard",
            description: (
              <span>
                <span className="break-all font-mono font-bold">{result!}</span>{" "}
                has been copied to your clipboard
              </span>
            ),
          });
        }
      } catch (error) {
        console.error(error);
        captureException(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to ${actionType} document`,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrappedActions = {
    // handleViewDocument: createActionHandler("view"),
    handleViewTransaction: createActionHandler("viewTransaction"),
    handleCopyTxSignature: createActionHandler("copyTxSignature"),
    // handleCopyDocumentSignUrl: createActionHandler("copyDocumentSignUrl"),
    // handleCopyViewUrl: createActionHandler("copyViewUrl"),
    // handleDownloadDocument: createActionHandler("download"),
  };

  const columns = useMemo<ColumnDef<ViewDocument>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        enableHiding: false,
        cell: ({ row }) => {
          const doc = row.original;
          return (
            <div className="flex min-w-[200px] items-center gap-2">
              <span className="truncate font-medium">{doc.name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              variant={
                status === "completed"
                  ? "success"
                  : status === "expired"
                    ? "destructive"
                    : "secondary"
              }
            >
              {statusMap[status as SignatureStatus]}
            </Badge>
          );
        },
      },
      {
        accessorKey: "password",
        header: "Password",
        cell: ({ row }) => {
          return row.getValue("password") ? "Yes" : "No";
        },
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => {
          const date = row.getValue("expiresAt") as string;
          return date ? new Date(date).toLocaleDateString() : "Never";
        },
      },
      {
        accessorKey: "expired",
        header: "Expired",
        cell: ({ row }) => {
          return row.getValue("expired") ? "Yes" : "No";
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        size: 180,
        cell: ({ row }) => {
          return new Date(row.getValue("createdAt")).toLocaleString();
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        size: 180,
        cell: ({ row }) => {
          return new Date(row.getValue("updatedAt")).toLocaleString();
        },
      },
      {
        id: "actions",
        enableHiding: false,
        size: 50,
        cell: ({ row }) => {
          const document = row.original;
          console.log(document);
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* <DropdownMenuItem
                  onClick={() =>
                    wrappedActions.handleViewDocument(row.original)
                  }
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </DropdownMenuItem> */}
                <DropdownMenuItem
                  onClick={() =>
                    wrappedActions.handleViewTransaction(row.original)
                  }
                >
                  <Compass className="mr-1 h-4 w-4" />
                  View Transaction
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    wrappedActions.handleCopyTxSignature(row.original)
                  }
                >
                  <Copy className="mr-1 h-4 w-4" />
                  Copy Tx Signature
                </DropdownMenuItem>
                {/* {!row.original.is_signed && (
                  <DropdownMenuItem
                    onClick={() =>
                      wrappedActions.handleCopyDocumentSignUrl(row.original)
                    }
                  >
                    <Share className="mr-1 h-4 w-4" />
                    Share Sign Link
                  </DropdownMenuItem>
                )} */}
                {/* <DropdownMenuItem
                  onClick={() => wrappedActions.handleCopyViewUrl(row.original)}
                >
                  <Link className="mr-1 h-4 w-4" />
                  Copy View Link
                </DropdownMenuItem> */}

                <DropdownMenuItem
                  onClick={() => renameDoc.setDocToRename(row.original)}
                >
                  <Pencil className="mr-1 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                {/* <DropdownMenuItem
                  onClick={() =>
                    wrappedActions.handleDownloadDocument(row.original)
                  }
                >
                  <Download className="mr-1 h-4 w-4" />
                  Download
                </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => deleteDoc.setDocToDelete(row.original)}
                  className="text-destructive"
                >
                  <Trash className="mr-1 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return columns;
}
