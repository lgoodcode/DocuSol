export const formatFileSize = (bytes: number): string => {
  const kb = bytes / 1024;
  const mb = kb / 1024;
  const gb = mb / 1024;

  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (kb < 1024) return `${Math.round(kb * 10) / 10} KB`;
  if (mb < 1024) return `${Math.round(mb * 10) / 10} MB`;
  return `${Math.round(gb * 10) / 10} GB`;
};
