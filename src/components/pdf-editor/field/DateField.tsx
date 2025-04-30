import { useRef, useState, useEffect, useCallback } from "react";
import { format } from "date-fns";

import {
  BaseField,
  FieldRenderContentProps,
} from "@/components/pdf-editor/field/BaseField";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useField } from "@/lib/pdf-editor/hooks/useField";

const DATE_FIELD_PROPS = {
  id: "date-field-content",
  className:
    "flex h-full w-full min-w-fit items-center justify-start p-2 whitespace-nowrap",
  value: (value: string) => format(new Date(value), "PPP"),
};

export function DateField({
  fieldId,
  viewType,
}: {
  fieldId: string;
  viewType: "editor" | "signer";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isSelected } = useField(fieldId, viewType);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(isSelected);
  }, [isSelected]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isWithinShadcnPopover =
        target.closest('[role="dialog"]') ||
        target.closest('[data-state="open"]') ||
        target.getAttribute("data-radix-popper-content-wrapper") !== null;

      if (
        containerRef.current &&
        // Dumb hack to prevent closing when clicking on the date field
        containerRef.current.textContent !== target.textContent &&
        !isWithinShadcnPopover
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const renderDateField = useCallback(
    ({
      field,
      isSelected,
      handleChange,
      handleFocus,
      handleBlur,
      Placeholder,
    }: FieldRenderContentProps) => {
      if (viewType === "signer" && isSelected) {
        return (
          <div ref={containerRef} className="relative h-full w-full">
            <Popover open={isOpen}>
              <PopoverTrigger asChild>
                <div
                  id={DATE_FIELD_PROPS.id}
                  className={DATE_FIELD_PROPS.className}
                  onClick={() => {
                    setIsOpen(true);
                    handleFocus();
                  }}
                >
                  {field.value ? (
                    DATE_FIELD_PROPS.value(field.value)
                  ) : (
                    <Placeholder />
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      handleChange(date.toISOString());
                      setIsOpen(false);
                      handleBlur();
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        );
      }

      if (!field.value) {
        throw new Error("DateField value is undefined");
      }

      return (
        <div id={DATE_FIELD_PROPS.id} className={DATE_FIELD_PROPS.className}>
          {DATE_FIELD_PROPS.value(field.value)}
        </div>
      );
    },
    [isOpen, containerRef],
  );

  return (
    <BaseField
      id={fieldId}
      viewType={viewType}
      renderContent={renderDateField}
    />
  );
}
