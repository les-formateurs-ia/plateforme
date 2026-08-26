
import { ExtractedPdf } from '../types';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

/**
 * Extracts text content from a PDF file.
 * @param file The PDF File object.
 * @returns A promise that resolves with an ExtractedPdf object containing the file name and its text content.
 */
export const extractTextFromPdf = async (file: File): Promise<ExtractedPdf> => {
  if (typeof window === 'undefined' || !window.pdfjsLib) {
    throw new Error('PDF.js library is not loaded. Ensure it is included in index.html.');
  }

  const arrayBuffer = await file.arrayBuffer();
  // The type of `pdfjsLib` is `any` because it's loaded via CDN and not a direct import.
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return { name: file.name, content: fullText };
};
