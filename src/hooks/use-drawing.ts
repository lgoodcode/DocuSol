"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface Point {
  x: number;
  y: number;
  type: "start" | "move";
}

interface Path {
  points: Point[];
}

export function useDrawing() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const pathsRef = useRef<Path[]>([]);
  const currentPathRef = useRef<Point[]>([]);

  // Set up the context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Set up the context
    context.strokeStyle = theme === "dark" ? "white" : "black";
    context.lineWidth = 2;
    context.lineCap = "round";
    contextRef.current = context;
  }, [theme]);

  // Update the context when the theme changes
  useEffect(() => {
    if (contextRef.current && hasDrawn) {
      const context = contextRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Update context style
      context.strokeStyle = theme === "dark" ? "white" : "black";
      context.lineWidth = 2;
      context.lineCap = "round";

      // Redraw all paths with the new color
      pathsRef.current.forEach((path) => {
        context.beginPath();
        path.points.forEach((point, index) => {
          if (point.type === "start" || index === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        });
        context.stroke();
      });
    }
  }, [theme, hasDrawn]);

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const { x, y } = getCoordinates(event, canvas);
    context.beginPath();
    context.moveTo(x, y);

    // Start a new path
    currentPathRef.current = [{ x, y, type: "start" }];
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const { x, y } = getCoordinates(event, canvas);
    context.lineTo(x, y);
    context.stroke();

    // Add point to current path
    currentPathRef.current.push({ x, y, type: "move" });
  };

  const stopDrawing = () => {
    if (isDrawing && currentPathRef.current.length > 0) {
      // Save the completed path
      pathsRef.current.push({ points: [...currentPathRef.current] });
      currentPathRef.current = [];
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    pathsRef.current = [];
    currentPathRef.current = [];
  };

  return {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    hasDrawn,
  };
}

// Helper function to get coordinates for both mouse and touch events
function getCoordinates(
  event: React.MouseEvent | React.TouchEvent,
  canvas: HTMLCanvasElement
) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if ("touches" in event) {
    const touch = event.touches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  } else {
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }
}
