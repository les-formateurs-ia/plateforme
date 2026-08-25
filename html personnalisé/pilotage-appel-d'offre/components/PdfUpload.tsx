
import React, { useState, useCallback } from 'react';
import { extractTextFromPdf } from '../utils/pdfReader';
import { ExtractedPdf } from '../types';
import Spinner from './Spinner';
import Accordion from './Accordion';

interface PdfUploadProps {
  onPdfsProcessed: (extractedPdfs: ExtractedPdf[], combinedText: string) => void;
  isLoading: boolean; // Indicates if the parent App component is loading (e.g., calling Gemini)
}

const PdfUpload: React.FC<PdfUploadProps> = ({ onPdfsProcessed, isLoading }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingFiles, setProcessingFiles] = useState(false); // Only for local PDF processing
  const [errors, setErrors] = useState<string[]>([]);
  const [extractedContents, setExtractedContents] = useState<ExtractedPdf[]>([]);
  const [isDragOver, setIsDragOver] = useState(false); // New state for drag-over visual feedback

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    // Filter out duplicates based on file name to avoid processing the same file multiple times
    const uniqueNewFiles = files.filter(
      (newFile: File) => !selectedFiles.some((existingFile: File) => existingFile.name === newFile.name)
    );
    setSelectedFiles((prev) => [...prev, ...uniqueNewFiles]);
    setErrors([]); // Clear errors on new file selection
    event.target.value = ''; // Clear the input so same file can be selected again
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false); // Reset drag-over state

    const files = Array.from(event.dataTransfer.files).filter((file: File) => file.type === 'application/pdf');
    const uniqueNewFiles = files.filter(
      (newFile: File) => !selectedFiles.some((existingFile: File) => existingFile.name === newFile.name)
    );
    setSelectedFiles((prev) => [...prev, ...uniqueNewFiles]);
    setErrors([]);
  }, [selectedFiles]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true); // Set drag-over state
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false); // Reset drag-over state
  }, []);

  const processPdfs = useCallback(async () => {
    setProcessingFiles(true);
    setErrors([]);
    setExtractedContents([]);
    const newExtractedPdfs: ExtractedPdf[] = [];
    const newErrors: string[] = [];

    for (const file of selectedFiles) {
      try {
        const extracted = await extractTextFromPdf(file);
        newExtractedPdfs.push(extracted);
      } catch (error: any) {
        newErrors.push(`Échec du traitement de ${file.name}: ${error.message}`);
        console.error(`Erreur lors du traitement du PDF ${file.name}:`, error);
      }
    }

    setExtractedContents(newExtractedPdfs);
    setErrors(newErrors);
    setProcessingFiles(false);
    
    const combinedText = newExtractedPdfs.map(pdf => pdf.content).join('\n\n--- Nouveau document PDF ---\n\n');
    onPdfsProcessed(newExtractedPdfs, combinedText); // Pass processed PDFs AND combined text to parent
  }, [selectedFiles, onPdfsProcessed]);

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
    setExtractedContents(prev => prev.filter(pdf => pdf.name !== fileName));
    setErrors(prev => prev.filter(err => !err.includes(fileName))); // Remove errors related to this file
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl mb-8">
      <h2 className="text-4xl font-extrabold text-[#002D62] mb-8 text-center">
        Télécharger les documents d'appel d'offre
      </h2>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-4 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ease-in-out
          ${isDragOver ? 'border-[#002D62] bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-[#002D62] hover:bg-gray-100'}`}
        onClick={() => document.getElementById('fileInput')?.click()}
        aria-label="Glisser-déposer ou cliquer pour sélectionner des fichiers PDF"
      >
        <input
          id="fileInput"
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 text-[#002D62] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-2xl text-gray-700 font-semibold mb-3">
          Glissez & déposez vos fichiers PDF ici
        </p>
        <p className="text-lg text-gray-600">
          ou <span className="font-bold text-[#F06A00] underline">cliquez pour sélectionner</span>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Seuls les fichiers PDF sont acceptés.
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-inner">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Fichiers sélectionnés ({selectedFiles.length}):</h3>
          <ul className="space-y-3">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm border border-gray-200 text-gray-700">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#F06A00] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium text-lg">{file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(file.name)}
                  className="text-red-500 hover:text-red-700 ml-4 p-1 rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  title="Supprimer le fichier"
                  aria-label={`Supprimer le fichier ${file.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={processPdfs}
            disabled={processingFiles || isLoading || selectedFiles.length === 0}
            className={`mt-8 w-full py-4 px-8 rounded-xl text-xl font-bold text-white transition-all duration-300 ease-in-out flex items-center justify-center space-x-3 shadow-lg
              ${processingFiles || isLoading || selectedFiles.length === 0
                ? 'bg-gradient-to-r from-gray-400 to-gray-600 cursor-not-allowed opacity-70' // Greyed out when disabled
                : 'bg-gradient-to-r from-[#002D62] to-[#F06A00] hover:from-[#F06A00] hover:to-[#002D62] focus:outline-none focus:ring-4 focus:ring-blue-300' // Dalkia gradient
              }`}
            aria-label="Extraire le texte et générer le planning"
          >
            {(processingFiles || isLoading) ? <Spinner /> : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M10 12H7m-3 0h3m-3 4h3m-6-4h.01M10 16H7m-3 0h3" />
                </svg>
                <span>Extraire le texte et générer le planning</span>
              </>
            )}
          </button>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-8 p-6 bg-red-100 border border-red-400 text-red-800 rounded-lg shadow-md">
          <h3 className="font-bold text-xl mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Erreurs lors du traitement:
          </h3>
          <ul className="list-disc list-inside space-y-1 ml-4">
            {errors.map((error, index) => (
              <li key={index} className="text-red-700">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {extractedContents.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-5 text-center">Contenu textuel extrait des PDF:</h3>
          {extractedContents.map((pdf, index) => (
            <Accordion key={index} title={pdf.name}>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-200 overflow-x-auto max-h-60 custom-scrollbar">
                {pdf.content}
              </pre>
            </Accordion>
          ))}
        </div>
      )}
    </div>
  );
};

export default PdfUpload;