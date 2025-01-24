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
} from "lucide-react";

import type { ViewDocument } from "@/lib/supabase/types";
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

import { viewDocument, downloadDocument, deleteDocument } from "./actions";

type ActionType = "view" | "download" | "delete";

const actionMap = {
  view: viewDocument,
  download: downloadDocument,
  delete: deleteDocument,
} as const;

export function useColumns(handleDelete: (id: string) => void) {
  const { toast } = useToast();

  const createActionHandler = useCallback((actionType: ActionType) => {
    return async (documentId: string) => {
      try {
        await actionMap[actionType](documentId);

        if (actionType === "delete") {
          handleDelete(documentId);
          // Remove from IndexedDB
          removeDocument(documentId).catch((error) => {
            console.error(error);
            captureException(error);
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
            <div className="flex items-center gap-2">
              <span className="font-medium">{doc.name}</span>
              <div className="flex gap-1">
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
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
          return new Date(row.getValue("createdAt")).toLocaleDateString();
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
        cell: ({ row }) => {
          return row.getValue("mimeType") as string;
        },
      },
      {
        id: "actions",
        enableHiding: false,
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
