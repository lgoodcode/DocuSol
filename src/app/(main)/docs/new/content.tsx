"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Stepper } from "@/components/ui/stepper";

import { useDocumentStore } from "./useDocumentStore";
import { UploadFileStep } from "./upload-file-step";
import { SelectSignersStep } from "./select-signers-step";
import { SigningStep } from "./signing-step";
import { ReviewStep } from "./review-step";

export function NewDocContent() {
  const { currentStep, setCurrentStep } = useDocumentStore();

  // Convert the string step to a number index for the stepper component
  const stepToIndex = {
    upload: 0,
    signers: 1,
    fields: 2,
    review: 3,
  };

  const currentStepIndex = stepToIndex[currentStep];

  // Initialize the document store if needed
  useEffect(() => {
    // If the current step is not set, set it to upload
    if (!currentStep) {
      setCurrentStep("upload");
    }
  }, [currentStep, setCurrentStep]);

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
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Stepper
          steps={[
            "Upload Document",
            "Select Signers",
            "Sign Document",
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
            <SelectSignersStep onStepComplete={onStepComplete} />
          )}
          {currentStepIndex === 2 && (
            <SigningStep onStepComplete={onStepComplete} />
          )}
          {currentStepIndex === 3 && (
            <ReviewStep onStepComplete={onStepComplete} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
