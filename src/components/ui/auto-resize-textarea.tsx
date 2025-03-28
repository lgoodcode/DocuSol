import { useEffect, useRef, useState, forwardRef } from "react";

interface AutoResizeTextareaProps {
  placeholder?: string;
  className?: string;
  initialValue?: string;
  minRows?: number;
  minCols?: number;
  maxWidth?: number;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
  handleFocus?: () => void;
  handleBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  autoFocus?: boolean;
}

export const AutoResizeTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(function AutoResizeTextarea(
  {
    placeholder = "",
    className = "",
    initialValue = "",
    minRows = 1,
    minCols = 7,
    maxWidth = 800,
    onChange,
    style = {},
    handleFocus,
    handleBlur,
    autoFocus = false,
  },
  ref,
) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hiddenDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof ref === "function") {
      ref(textareaRef.current);
    } else if (ref) {
      ref.current = textareaRef.current;
    }
  }, [ref]);

  const updateTextareaSize = () => {
    if (!textareaRef.current || !hiddenDivRef.current) return;

    const textarea = textareaRef.current;
    const hiddenDiv = hiddenDivRef.current;

    // Copy all computed styles from textarea to hidden div for accurate measurement
    const textareaStyles = window.getComputedStyle(textarea);

    // Apply the same styles to the hidden div
    hiddenDiv.style.fontFamily = textareaStyles.fontFamily;
    hiddenDiv.style.fontSize = textareaStyles.fontSize;
    hiddenDiv.style.fontWeight = textareaStyles.fontWeight;
    hiddenDiv.style.letterSpacing = textareaStyles.letterSpacing;
    hiddenDiv.style.fontStyle = textareaStyles.fontStyle;
    hiddenDiv.style.lineHeight = textareaStyles.lineHeight;
    hiddenDiv.style.textTransform = textareaStyles.textTransform;

    // Apply custom styles directly
    Object.assign(hiddenDiv.style, style);

    // Copy the textarea's content to the hidden div
    hiddenDiv.innerHTML =
      value.replace(/\n$/, "<br/>").replace(/\n/g, "<br/>") || "&nbsp;";

    // Calculate height based on line breaks only
    const lineCount = (value.match(/\n/g) || []).length + 1;
    // Get line height from computed styles or use default
    const computedLineHeight =
      Number.parseInt(textareaStyles.lineHeight) ||
      Number.parseInt(textareaStyles.fontSize) * 1.2 ||
      24;
    const newHeight = Math.max(
      lineCount * computedLineHeight,
      minRows * computedLineHeight,
    );

    // For width calculation, we need to measure without wrapping
    hiddenDiv.style.width = "auto";
    hiddenDiv.style.whiteSpace = "pre";

    // Calculate the content width - add a small buffer based on font size
    const fontSize = Number.parseInt(textareaStyles.fontSize) || 16;
    const charWidth = fontSize * 0.6; // Approximate character width based on font size
    const contentWidth = Math.max(hiddenDiv.scrollWidth, minCols * charWidth);

    // Add a small buffer that scales with font size, but not too much
    const buffer = Math.min(fontSize * 0.5, 10);
    const newWidth = Math.min(contentWidth + buffer, maxWidth);

    // Apply the calculated dimensions
    textarea.style.width = `${newWidth}px`;
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    updateTextareaSize();
  }, [value]);

  // Initial resize after component mounts and when style changes
  useEffect(() => {
    // Small delay to ensure styles are applied
    const timer = setTimeout(() => {
      updateTextareaSize();
    }, 0);
    return () => clearTimeout(timer);
  }, [style]);

  // Focus the textarea when component mounts if autoFocus is true
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`resize-none overflow-hidden rounded-md focus:outline-none ${className}`}
        style={{
          ...style,
          minHeight: `${minRows * (Number.parseInt(style.fontSize as string) * 1.2 || 24)}px`,
          minWidth: `${minCols * (Number.parseInt(style.fontSize as string) * 0.6 || 8)}px`,
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {/* Hidden div used for calculating dimensions - not visible to user */}
      <div
        ref={hiddenDivRef}
        className="invisible absolute left-0 top-0 -z-10 border border-transparent"
        style={{
          padding: "0px",
          overflowWrap: "normal",
          whiteSpace: "pre",
          overflowY: "hidden",
          overflowX: "hidden",
        }}
        aria-hidden="true"
      />
    </div>
  );
});
