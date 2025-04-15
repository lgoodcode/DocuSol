"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";

import { UploadStep } from "./upload-step";
import { SignersStep } from "./signers-step";
import { EditingStep } from "./editing-step";
import { ReviewStep } from "./review-step";

const EXPIRATION_TIME = 1000 * 60 * 60 * 24; // 1 day

const isStoreExpired = (createdAt: number) => {
  return Date.now() - createdAt > EXPIRATION_TIME;
};

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

  // Run only once on mount to check initial state and expiration
  useEffect(() => {
    const { currentStep, createdAt } = useDocumentStore.getState();
    if (!currentStep || isStoreExpired(createdAt)) {
      console.log(
        "Resetting document store due to missing step or expiration.",
      );
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]); // Only depend on reset to ensure it's available

  const onStepComplete = () => {
    const nextStepIndex = currentStepIndex + 1;
    const nextStep = Object.keys(stepToIndex).find(
      (key) => stepToIndex[key as keyof typeof stepToIndex] === nextStepIndex,
    ) as "upload" | "signers" | "fields" | "review";

    setCurrentStep(nextStep);
  };

  return (
    <div className="grid gap-6 py-8">
      <div className="fixed right-4 top-4 flex items-center gap-2">
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
          hideButtons
          currentStep={currentStepIndex}
          steps={[
            "Upload Document",
            "Assign Signers",
            "Edit Document",
            "Review and Send",
          ]}
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
            <UploadStep onStepComplete={onStepComplete} />
          )}
          {currentStepIndex === 1 && (
            <SignersStep onStepComplete={onStepComplete} />
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
