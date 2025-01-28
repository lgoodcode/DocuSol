"use client";

import { useMemo, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { captureException } from "@sentry/nextjs";
import {
  MoreHorizontal,
  Download,
  Eye,
  Trash,
  Lock,
  Globe,
  Compass,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { removeDocument } from "@/lib/utils/db";

import {
  viewDocument,
  viewTransaction,
  copyTxSignature,
  downloadDocument,
  deleteDocument,
} from "./actions";

type ActionType =
  | "view"
  | "viewTransaction"
  | "copyTxSignature"
  | "download"
  | "delete";

const actionMap = {
  view: viewDocument,
  viewTransaction,
  copyTxSignature,
  download: downloadDocument,
  delete: deleteDocument,
} as const;

export function useColumns(handleDelete: (id: string) => void) {
  const { toast } = useToast();

  const createActionHandler = useCallback((actionType: ActionType) => {
    return async (id: string) => {
      try {
        await actionMap[actionType](id);

        if (actionType === "delete") {
          handleDelete(id);
          // Remove from IndexedDB
          removeDocument(id).catch((error) => {
            console.error(error);
            captureException(error);
          });
        } else if (actionType === "copyTxSignature") {
          toast({
            title: "Transaction Signature Copied",
            description: (
              <span>
                <span className="font-bold font-mono break-all">{id}</span> has
                been copied to your clipboard
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
    handleViewDocument: createActionHandler("view"),
    handleViewTransaction: createActionHandler("viewTransaction"),
    handleCopyTxSignature: createActionHandler("copyTxSignature"),
    handleDownloadDocument: createActionHandler("download"),
    handleDeleteDocument: createActionHandler("delete"),
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
            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="font-medium truncate">{doc.name}</span>
              <div className="flex gap-1 flex-shrink-0">
                {doc.password ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
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
                status === "signed"
                  ? "success"
                  : status === "expired"
                  ? "destructive"
                  : "secondary"
              }
            >
              {status}
            </Badge>
          );
        },
      },
      // {
      //   accessorKey: "expiresAt",
      //   header: "Expires",
      //   cell: ({ row }) => {
      //     const date = row.getValue("expiresAt") as string;
      //     return date ? new Date(date).toLocaleDateString() : "Never";
      //   },
      // },
      {
        accessorKey: "mimeType",
        header: "Type",
        size: 100,
        cell: ({ row }) => {
          return row.getValue("mimeType") as string;
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
          // const document = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    wrappedActions.handleViewDocument(row.original.id)
                  }
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    wrappedActions.handleViewTransaction(
                      row.original.signedTxSignature ||
                        row.original.unsignedTxSignature
                    )
                  }
                >
                  <Compass className="mr-2 h-4 w-4" />
                  View Transaction
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    wrappedActions.handleCopyTxSignature(
                      row.original.signedTxSignature ||
                        row.original.unsignedTxSignature
                    )
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Tx Signature
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    wrappedActions.handleDownloadDocument(row.original.id)
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    wrappedActions.handleDeleteDocument(row.original.id)
                  }
                  className="text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return columns;
}
