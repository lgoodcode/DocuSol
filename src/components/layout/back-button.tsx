"use client";

import { Button } from "@/components/ui/button";

export function BackButton() {
  return <Button onClick={() => window.history.back()}>Go back</Button>;
}
