"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Stepper } from "@/components/ui/stepper";
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { cn, dataUrlToFile } from "@/lib/utils";

import { UploadFileStep } from "./upload-file-step";
import { AssignSignersStep } from "./assign-signers-step";
import { EditingStep } from "./editing-step";
import { ReviewStep } from "./review-step";
import { Button } from "@/components/ui/button";

export function NewDocContent() {
  const { currentStep, setCurrentStep, reset, viewType, setViewType } =
    useDocumentStore();

  // Convert the string step to a number index for the stepper component
  const stepToIndex = {
    upload: 0,
    signers: 1,
    fields: 2,
    review: 3,
  };

  const currentStepIndex = stepToIndex[currentStep];

  useEffect(() => {
    // Initialization - if there is no step, reset the store
    if (!currentStep) {
      reset();
    }
  }, [currentStep, reset]);

  const onStepComplete = () => {
    const nextStepIndex = currentStepIndex + 1;
    const nextStep = Object.keys(stepToIndex).find(
      (key) => stepToIndex[key as keyof typeof stepToIndex] === nextStepIndex,
    ) as "upload" | "signers" | "fields" | "review";

    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  const handleStepChange = (index: number) => {
    const step = Object.keys(stepToIndex).find(
      (key) => stepToIndex[key as keyof typeof stepToIndex] === index,
    ) as "upload" | "signers" | "fields" | "review";

    if (step) {
      setCurrentStep(step);
    }
  };

  return (
    <div
      className={cn(
        "space-y-12 py-8",
        currentStep === "fields" && "h-dvh overflow-hidden",
      )}
    >
      <div className="flex items-center gap-2">
        <span>{viewType}</span>
        <Button onClick={() => setViewType("signer")}>Signer</Button>
        <Button onClick={() => setViewType("editor")}>Editor</Button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto max-w-4xl"
      >
        <Stepper
          steps={[
            "Upload Document",
            "Assign Signers",
            "Edit Document",
            "Review and Send",
          ]}
          currentStep={currentStepIndex}
          onChange={handleStepChange}
          hideButtons={true}
        />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {currentStepIndex === 0 && (
            <UploadFileStep onStepComplete={onStepComplete} />
          )}
          {currentStepIndex === 1 && (
            <AssignSignersStep onStepComplete={onStepComplete} />
          )}
          {currentStepIndex === 2 && (
            <EditingStep onStepComplete={onStepComplete} />
          )}
          {currentStepIndex === 3 && (
            <ReviewStep onStepComplete={onStepComplete} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
