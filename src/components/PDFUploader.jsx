/**
 * PDFUploader Component
 * 
 * Handles PDF file upload and triggers the extraction pipeline.
 * Provides UI feedback during processing.
 */

import React, { useRef, useState } from 'react';
import { validatePDFFile, extractTextFromPDF } from '../services/pdfExtractor';
import { parseShareholderInfo } from '../services/heuristicParser';
import { parseWithOpenAI, isOpenAIAvailable } from '../services/openaiParser';

export default function PDFUploader({ onExtractionComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [useOpenAI, setUseOpenAI] = useState(false);
  const fileInputRef = useRef(null);
  
  const openAIAvailable = isOpenAIAvailable();

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    try {
      // Validate file
      const validation = validatePDFFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Extract text from PDF
      const { text, pageCount, warnings: extractionWarnings } = await extractTextFromPDF(file);
      
      // Parse shareholder information
      let result;
      if (useOpenAI && openAIAvailable) {
        result = await parseWithOpenAI(text);
      } else {
        result = parseShareholderInfo(text);
      }

      // Combine all warnings
      const allWarnings = [
        ...extractionWarnings,
        ...result.warnings
      ];

      // Return results to parent
      onExtractionComplete({
        fileName: file.name,
        pageCount,
        companyName: result.companyName,
        shareholders: result.shareholders,
        warnings: allWarnings,
        extractionMethod: useOpenAI && openAIAvailable ? 'OpenAI' : 'Heuristic'
      });

    } catch (err) {
      setError(err.message);
      onExtractionComplete(null);
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="uploader-container">
      <div className="uploader-card">
        <h2>Upload Shareholder Document</h2>
        <p className="uploader-description">
          Upload a PDF containing shareholder information to extract company name, 
          shareholder names, and share counts.
        </p>

        {/* Extraction Method Toggle */}
        {openAIAvailable && (
          <div className="extraction-toggle">
            <label>
              <input
                type="checkbox"
                checked={useOpenAI}
                onChange={(e) => setUseOpenAI(e.target.checked)}
                disabled={isProcessing}
              />
              <span>Use OpenAI for enhanced extraction</span>
            </label>
            <p className="toggle-note">
              {useOpenAI 
                ? '⚠️ PDF content will be sent to OpenAI\'s API' 
                : 'Currently using local extraction (no external APIs)'}
            </p>
          </div>
        )}

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          disabled={isProcessing}
          style={{ display: 'none' }}
        />

        {/* Upload Button */}
        <button
          onClick={handleButtonClick}
          disabled={isProcessing}
          className="upload-button"
        >
          {isProcessing ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            '📄 Select PDF File'
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}


