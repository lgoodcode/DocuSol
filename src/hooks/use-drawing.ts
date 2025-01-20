"use client";

import { useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";

interface Point {
  x: number;
  y: number;
}

export function useDrawing() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsDrawing(true);
      setHasDrawn(true);
      const point = getPointFromEvent(e, canvas);
      setLastPoint(point);
    },
    []
  );

  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;
      if (!canvas || !isDrawing || !lastPoint) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Prevent scrolling on touch devices
      e.preventDefault();

      const currentPoint = getPointFromEvent(e, canvas);
      if (!currentPoint) return;

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.strokeStyle = theme === "dark" ? "white" : "black";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();

      setLastPoint(currentPoint);
    },
    [isDrawing, lastPoint, theme]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setHasDrawn(false);
    setLastPoint(null);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    hasDrawn,
  };
}

function getPointFromEvent(
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): Point | null {
  const rect = canvas.getBoundingClientRect();
  let x, y;

  if ("touches" in e) {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  } else {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }

  // Scale based on canvas size vs display size
  x = (x * canvas.width) / rect.width;
  y = (y * canvas.height) / rect.height;

  return { x, y };
}
