import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonContent() {
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* File Upload Card */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-36" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Document Options Card */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-72" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signature Card */}
      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start gap-4 sm:gap-0 sm:items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-[3/2] sm:aspect-[3/1] w-full" />
          </CardContent>
          <div className="p-6 flex justify-end">
            <Skeleton className="h-10 w-36" />
          </div>
        </Card>
      </div>
    </div>
  );
}
