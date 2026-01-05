import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(file) {
  const warnings = [];
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    
    const textPromises = [];
    for (let i = 1; i <= pageCount; i++) {
      textPromises.push(extractPageText(pdf, i));
    }
    
    const pageTexts = await Promise.all(textPromises);
    const text = pageTexts.join('\n\n--- PAGE BREAK ---\n\n');
    
    if (pageCount > 50) {
      warnings.push(`Large document: ${pageCount} pages. Extraction may be slower.`);
    }
    
    if (text.length < 100) {
      warnings.push('Extracted text is very short. PDF might be image-based or encrypted.');
    }
    
    return { text, pageCount, warnings };
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

async function extractPageText(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const textContent = await page.getTextContent();
  
  const text = textContent.items
    .map(item => item.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return text;
}

export function validatePDFFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'File must be a PDF' };
  }
  
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { 
      valid: true, 
      error: `File is large (${(file.size / 1024 / 1024).toFixed(2)}MB). Processing may be slow.` 
    };
  }
  
  return { valid: true };
}

