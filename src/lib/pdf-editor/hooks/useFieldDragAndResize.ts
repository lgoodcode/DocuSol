import { useRef, useCallback } from "react";
import { useField } from "@/lib/pdf-editor/hooks/useField";

export function useFieldDragAndResize(fieldId: string) {
  const { field, scale, updateField, setIsDragging, setIsResizing } =
    useField(fieldId);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!field) return;

      e.preventDefault();
      startPos.current = { x: e.clientX, y: e.clientY };
      setIsDragging(true);

      const handleDrag = (e: MouseEvent) => {
        const dx = (e.clientX - startPos.current.x) / scale;
        const dy = (e.clientY - startPos.current.y) / scale;

        updateField({
          id: fieldId,
          position: {
            x: field.position.x + dx,
            y: field.position.y + dy,
            page: field.position.page,
          },
        });

        startPos.current = { x: e.clientX, y: e.clientY };
      };

      const handleDragEnd = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleDrag);
        document.removeEventListener("mouseup", handleDragEnd);
      };

      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", handleDragEnd);
    },
    [field, fieldId, scale, updateField, setIsDragging],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!field) return;

      e.preventDefault();
      e.stopPropagation();
      startPos.current = { x: e.clientX, y: e.clientY };
      startSize.current = {
        width: field.size.width,
        height: field.size.height,
      };
      setIsResizing(true);

      const handleResize = (e: MouseEvent) => {
        const dx = (e.clientX - startPos.current.x) / scale;
        const dy = (e.clientY - startPos.current.y) / scale;

        updateField({
          id: fieldId,
          size: {
            width: Math.max(50, startSize.current.width + dx),
            height: Math.max(30, startSize.current.height + dy),
          },
        });
      };

      const handleResizeEnd = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleResize);
        document.removeEventListener("mouseup", handleResizeEnd);
      };

      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", handleResizeEnd);
    },
    [field, fieldId, scale, updateField, setIsResizing],
  );

  return {
    handleDragStart,
    handleResizeStart,
  };
}
