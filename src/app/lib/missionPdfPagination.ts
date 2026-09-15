export interface PrintInterval { start: number; end: number }

// Prefer whole paragraphs, but split long answers between their rendered lines.
export function planPdfPages(
  height: number,
  pageHeight: number,
  lines: PrintInterval[],
  blocks: PrintInterval[] = [],
  forced: number[] = [],
): PrintInterval[] {
  if (!Number.isFinite(height) || height <= 0 || !Number.isFinite(pageHeight) || pageHeight <= 0) throw new Error("Invalid PDF dimensions");
  const pages: PrintInterval[] = [];
  const protectedItems = [...blocks.map((item) => ({ ...item, line: false })), ...lines.map((item) => ({ ...item, line: true }))];
  let start = 0;
  while (start < height) {
    const limit = Math.min(start + pageHeight, height);
    const explicit = forced.filter((y) => y > start + 1 && y <= limit).sort((a, b) => a - b)[0];
    let end = explicit ?? limit;
    if (end < height) {
      let previous: number;
      do {
        previous = end;
        for (const item of protectedItems) {
          const minimum = item.line ? start + 1 : start + pageHeight * 0.55;
          if (item.start < end && item.end > end && item.start >= minimum && item.end - item.start <= pageHeight) end = item.start;
        }
      } while (end < previous);
    }
    if (end <= start) end = limit;
    pages.push({ start, end });
    start = end;
  }
  return pages;
}
