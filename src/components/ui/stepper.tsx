import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function Stepper({
  steps,
  currentStep,
  onChange,
  hideButtons = false,
}: {
  steps: string[];
  currentStep: number;
  onChange: (step: number) => void;
  hideButtons?: boolean;
}) {
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onChange(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      onChange(currentStep - 1);
    }
  };

  return (
    <div className="w-full">
      <div
        className="mb-4 grid"
        style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
      >
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center",
              index <= currentStep
                ? "font-semibold text-primary"
                : "text-muted-foreground",
            )}
          >
            <div className="flex w-full items-center">
              <motion.div
                className={cn("h-0.5 w-full", index === 0 ? "invisible" : "")}
                initial={false}
                animate={{
                  background:
                    index <= currentStep
                      ? "hsl(var(--primary))"
                      : "hsl(var(--border))",
                }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                  "transition-colors duration-200",
                  index === currentStep && "border-primary bg-background",
                  index < currentStep &&
                    "border-primary bg-primary text-primary-foreground",
                  index > currentStep && "border-border bg-background",
                )}
                initial={false}
                animate={{
                  scale: index === currentStep ? 1.1 : 1,
                  transition: { type: "spring", stiffness: 500, damping: 30 },
                }}
              >
                {index < currentStep ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {index + 1}
                  </motion.span>
                )}
              </motion.div>
              <motion.div
                className={cn(
                  "h-0.5 w-full",
                  index === steps.length - 1 ? "invisible" : "",
                )}
                initial={false}
                animate={{
                  background:
                    index < currentStep
                      ? "hsl(var(--primary))"
                      : "hsl(var(--border))",
                }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <motion.span
              initial={false}
              animate={{
                color:
                  index <= currentStep
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground))",
              }}
              className="mt-2 text-sm"
            >
              {step}
            </motion.span>
          </div>
        ))}
      </div>
      {!hideButtons && (
        <div className="mt-4 flex justify-between">
          <Button
            variant="secondary"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
