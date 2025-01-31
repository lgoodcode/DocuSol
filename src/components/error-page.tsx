import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ErrorPageProps {
  title?: string
  message?: string
  className?: string
  retry?: () => void
}


export function ErrorPage({
  title = "Something went wrong",
  message = "An error occurred while processing your request. Please try again later.",
  className,
  retry
}: ErrorPageProps) {
  return (
    <div className={cn("container max-w-4xl mx-auto py-32 px-4", className)}>
      <div className="text-center space-y-8">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>

        {retry && (
          <Button
            variant="outline"
            onClick={retry}
            className="mx-auto"
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  )
}
