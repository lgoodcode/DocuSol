# PDF Editor Performance Optimization Guide

This document provides guidelines and best practices for optimizing performance in the PDF Editor component, especially when working with fields and field selection.

## Common Performance Issues

1. **Unnecessary Re-renders**: When selecting fields, the entire PDF viewer shouldn't re-render
2. **PDF Document Reloading**: The PDF document should not reload when selecting different fields
3. **Cascade Re-renders**: Multiple components re-rendering when only one field has changed

## Best Practices

### 1. Use Optimized Hooks

Use the `useField` hook for field-specific operations:

```typescript
import { useField } from "@/lib/pdf-editor/hooks/useField";

function MyFieldComponent({ fieldId }) {
  const { field, isSelected, recipient, updateField, selectField } =
    useField(fieldId);

  // Now you can access field properties without triggering unnecessary re-renders
}
```

### 2. Memoize Components

Always wrap field components with `React.memo` to prevent unnecessary re-renders:

```typescript
import { memo } from "react";

export const MyFieldComponent = memo(function MyFieldComponent({ fieldId }) {
  // Component implementation
});
```

### 3. Memoize Expensive Calculations and Renders

Use `useMemo` for expensive calculations and JSX:

```typescript
const fieldContent = useMemo(() => {
  return renderContent({
    field,
    isSelected,
    viewType,
    handleChange,
    handleFocus,
    handleBlur,
  });
}, [
  field,
  isSelected,
  viewType,
  handleChange,
  handleFocus,
  handleBlur,
  renderContent,
]);
```

### 4. Use Targeted Selectors

When using Zustand selectors, select only what you need:

```typescript
// BAD - selects the entire state object
const { selectedFieldId, fields } = useDocumentStore();

// GOOD - select only what you need
const selectedFieldId = useDocumentStore((state) => state.selectedFieldId);
const fields = useDocumentStore((state) => state.fields);
```

### 5. Debounce or Throttle Frequent Updates

For operations like dragging or resizing, consider debouncing state updates:

```typescript
import { debounce } from "lodash";

// Create debounced function
const debouncedUpdate = debounce((position) => {
  updateField({
    id: fieldId,
    position,
  });
}, 16); // 60fps equivalent
```

## PDF Viewer Optimizations

1. **Page Filtering**: Filter fields by page so only relevant fields render on each page
2. **Memoize Page Rendering**: Use `useMemo` on page components to prevent re-renders when selection changes
3. **Prevent Document Reloading**: Use memoization to prevent the PDF document from reloading

## Store Optimizations

1. **Selective Updates**: Only update state when values actually change

```typescript
// In useDocumentStore.ts
setSelectedFieldId: (id) =>
  set((state) => {
    // Only update if the selection actually changes
    if (state.selectedFieldId === id) return {};
    return { selectedFieldId: id };
  }),
```

2. **Shallow Equality Checks**: Ensure your state updates use proper equality checks to prevent unnecessary renders

## Debugging Performance Issues

1. Use React DevTools Profiler to identify unnecessary re-renders
2. Use `console.time()` and `console.timeEnd()` to measure performance of specific operations
3. Add component display names to make debugging easier

```typescript
Component.displayName = "MyComponent";
```

Remember: Performance optimization should be targeted and measured. Don't optimize prematurely!
