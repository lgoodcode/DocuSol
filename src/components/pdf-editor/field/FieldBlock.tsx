"use client";

import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import type { FieldTemplate, FieldType } from "@/lib/pdf-editor/document-types";
import type { DocumentSigner } from "@/lib/types/stamp";

/**
 * FieldBlock component for dragging and creating fields in the PDF editor
 * from the fields palette.
 */
export function FieldBlock({
  field,
  currentSigner,
}: {
  field: FieldTemplate;
  currentSigner: DocumentSigner;
}) {
  const setDragging = useDocumentStore((state) => state.setDragging);
  const scale = useDocumentStore((state) => state.scale);

  // Create and append custom drag image
  const createDragImage = (fieldType: FieldType, fieldLabel: string) => {
    // Create a div element for the drag image
    const dragImage = document.createElement("div");
    dragImage.className = "fixed top-0 left-0 pointer-events-none";
    dragImage.style.cssText =
      "background: var(--background); border-radius: var(--radius); padding: 8px 12px; box-shadow: var(--shadow); display: flex; align-items: center; justify-content: space-between; width: 120px; z-index: 9999; transform-origin: top left;";

    // Create the field label element
    const labelElement = document.createElement("span");
    labelElement.textContent = fieldLabel;
    labelElement.style.cssText = "font-size: 14px; color: var(--foreground);";

    // Append label to drag image
    dragImage.appendChild(labelElement);

    // Create the icon container
    const iconContainer = document.createElement("div");
    iconContainer.style.cssText = "display: flex; align-items: center;";

    // Get the SVG icon string based on field type and append it
    let iconSvg = "";
    switch (fieldType) {
      case "text":
        iconSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 15V9" /><path d="M12 9v6" /></svg>';
        break;
      case "signature":
        iconSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 9l-6 6-6-6" /></svg>';
        break;
      case "date":
        iconSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>';
        break;
      case "initials":
        iconSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h6v12"/><path d="M13 15l6 6"/><path d="M13 21l6-6"/></svg>';
        break;
      default:
        iconSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /></svg>';
    }

    iconContainer.innerHTML = iconSvg;
    dragImage.appendChild(iconContainer);

    // Apply scale transform
    dragImage.style.transform = `scale(${scale})`;

    // Append to body temporarily
    document.body.appendChild(dragImage);

    return dragImage;
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!currentSigner) {
      e.preventDefault();
      return;
    }

    // Calculate offset based on click position relative to the field block
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    e.dataTransfer.setData("field-type", field.type);
    e.dataTransfer.setData("assignedTo", currentSigner.id);
    e.dataTransfer.setData("scale", scale.toString());
    e.dataTransfer.setData("offsetX", offsetX.toString());
    e.dataTransfer.setData("offsetY", offsetY.toString());

    setDragging(true);

    // Create custom drag image
    const dragImage = createDragImage(field.type, field.label);

    // Set the drag image with calculated offset
    e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);

    // Remove the element after a short delay
    setTimeout(() => {
      if (dragImage.parentNode) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDragging(false);
  };

  return (
    <div
      className={cn(
        "field-item flex flex-col items-center justify-center rounded-md p-2.5 text-sm transition-colors",
        "border border-transparent",
        "hover:bg-accent hover:text-accent-foreground",
        "active:bg-accent/80",
        !currentSigner && "cursor-not-allowed opacity-50",
        currentSigner && "cursor-grab",
      )}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      draggable={!!currentSigner}
      title={!currentSigner ? "Select a recipient first" : field.label}
    >
      <field.icon className="mb-1.5 h-5 w-5 text-muted-foreground" />
      <span className="text-sm font-medium">{field.label}</span>
    </div>
  );
}
