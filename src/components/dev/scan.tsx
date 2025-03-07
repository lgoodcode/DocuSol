"use client";

import { scan } from "react-scan";
import { useEffect } from "react";

import { IS_PROD } from "@/constants";

export function Scan() {
  useEffect(() => {
    if (IS_PROD) return;
    scan({ enabled: true });
  }, []);

  return <></>;
}
