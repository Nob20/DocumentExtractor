import React, { useState } from 'react';
import PDFUploader from './components/PDFUploader';
import ExtractionResults from './components/ExtractionResults';
import ExtractionWarnings from './components/ExtractionWarnings';
import './App.css';

export default function App() {
  const [extractionData, setExtractionData] = useState(null);

  const handleExtractionComplete = (data) => {
    setExtractionData(data);
  };

  const handleReset = () => {
    setExtractionData(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📄 Document Data Extractor</h1>
        <p className="app-subtitle">
          Extract structured information from corporate documents
        </p>
      </header>

      <main className="app-main">
        <PDFUploader onExtractionComplete={handleExtractionComplete} />

        {extractionData && (
          <>
            <ExtractionWarnings warnings={extractionData.warnings} />
            <ExtractionResults data={extractionData} />
            
            <div className="reset-section">
              <button onClick={handleReset} className="reset-button">
                🔄 Process Another Document
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Document processing application built with React and OpenAI.
        </p>
      </footer>
    </div>
  );
}

