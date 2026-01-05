# Document Data Extractor

A React application for extracting shareholder information from PDF documents. Processes files locally with optional OpenAI-enhanced extraction.

**🔗 Live Demo:** https://document-extractor-three.vercel.app/  
**📦 Repository:** https://github.com/Nob20/DocumentExtractor

---

## Quick Start

```bash
# Install dependencies
npm install

# Start the application
npm start

# Run tests
npm test
```

The app opens at `http://localhost:3000`. Upload a PDF to see extracted shareholder data.

---

## Live Demo

**🚀 Deployed Application:** https://document-extractor-three.vercel.app/

Try the application live without any local setup required!

---

## Optional: Enable OpenAI Extraction

```bash
# 1. Create environment file
cp env.example .env.local

# 2. Add your OpenAI API key
echo "REACT_APP_OPENAI_API_KEY=sk-your-key-here" > .env.local
echo "REACT_APP_OPENAI_MODEL=gpt-5.2" >> .env.local

# 3. Restart server
npm start
```

The OpenAI toggle will appear automatically in the UI.

---

## Input Document Assumptions

The application expects PDFs with:

1. **Company name** in the first 100 characters containing "Inc.", "LLC", or "Corp."
2. **Shareholder section** labeled as:
   - "EXHIBIT A" or "SCHEDULE A" or "RESTRICTED STOCK PURCHASERS"
3. **Shareholder data** with:
   - Names: 2-3 words, properly capitalized (e.g., "John Smith", "Mary Jane Doe")
   - Share counts: Numbers between 10 and 100,000,000

**Supported documents:** Shareholder agreements, cap tables, stock certificates, board resolutions

---

## Extraction Approach

### Two-Stage Pipeline

#### 1. **Heuristic Parser** (Default)
- Regex-based pattern matching
- Fast, free, runs locally
- Works well with standard table formats

**Process:**
1. Extract company name from document header
2. Find shareholder section (EXHIBIT A → SCHEDULE A → RESTRICTED STOCK PURCHASERS)
3. Match pattern: `Name Name (Name?) Number shares`
4. Validate names (capitalization, length) and share counts (range)
5. Remove duplicates and table headers

**Limitations:** Requires standard formatting, struggles with unusual layouts

#### 2. **OpenAI Parser** (Optional)
- LLM-based semantic understanding using `gpt-5.2`
- Handles complex/non-standard formats
- Requires API key, slower, costs money

**Process:**
1. Truncate document to 2,000,000 characters (if needed)
2. Send structured prompt to OpenAI API (temperature: 0, max tokens: 20,000)
3. Parse JSON response with company name and shareholders
4. Validate data types and ranges

**Limitations:** Network latency, non-deterministic, sends data externally

### Data Flow
```
PDF Upload → PDF.js Extraction → [Heuristic OR OpenAI] → Validation → Display → Export
```

---

## Known Limitations

1. **Format sensitivity** - Requires standard table layouts for heuristic parser
2. **Name validation** - Only 2-3 word names with proper capitalization
3. **Single section** - Extracts from one shareholder table only
4. **No OCR** - Scanned/image PDFs will fail
5. **No hybrid approach** - Either/or, not both (no confidence voting)

**Edge cases not handled:**
- Multiple tables per document
- Special characters in names
- Shares as percentages
- Multi-column complex layouts

---

## What I'd Do Next

### High Priority
1. **Hybrid extraction** - Run heuristic first, fallback to OpenAI if no results
2. **Confidence scoring** - Compare both methods and flag discrepancies
3. **Better table detection** - Support more formats (CSV, pipe-delimited, multi-line)
4. **Enhanced name handling** - Support suffixes (Jr., Sr.), initials, company names

### Medium Priority
5. **OCR support** - Integrate Tesseract.js for scanned PDFs
6. **Batch processing** - Upload and process multiple documents
7. **Advanced export** - Excel format, PDF reports
8. **Visual feedback** - Highlight extracted regions in PDF viewer

### Lower Priority
9. **Comprehensive testing** - Component tests, integration tests, fixtures
10. **Additional fields** - Extract vesting schedules, prices, dates
11. **Backend integration** - Persistent storage, user accounts, API

---

## Project Structure

```
src/
├── components/
│   ├── PDFUploader.jsx           # File upload & orchestration
│   ├── ExtractionResults.jsx     # Table display & export
│   └── ExtractionWarnings.jsx    # Warning messages
├── services/
│   ├── pdfExtractor.js            # PDF.js integration
│   ├── heuristicParser.js         # Regex-based parsing
│   ├── openaiParser.js            # OpenAI integration
│   └── __tests__/
│       └── heuristicParser.test.js  # Unit tests (10 passing)
├── App.jsx                        # Main component
└── index.js                       # Entry point
```

---

## Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

**Current coverage:**
- ✅ Company name extraction
- ✅ Shareholder extraction from EXHIBIT A
- ✅ Name/share validation
- ✅ Display formatting (commas, percentages)
- ✅ Warning generation
- ✅ Edge cases

**Results:** 10 tests passing in 0.4s

---

## Key Extension Points

### Add New Fields
Edit `src/services/heuristicParser.js`:
```javascript
// In extractFromSection()
const datePattern = /Date:\s*(\d{2}\/\d{2}\/\d{4})/;
const pricePattern = /\$(\d+\.\d{2})\s*per\s*share/i;
```

### Support New Document Formats
Edit `findShareholderSection()`:
```javascript
const capTableIndex = lowerText.indexOf('capitalization table');
if (capTableIndex !== -1) {
  return text.substring(capTableIndex, ...);
}
```

### Backend Integration
Create `src/services/api.js`:
```javascript
export async function saveExtraction(data) {
  return fetch('/api/extractions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
```

---

## Technology Stack

- **React 18** - UI framework
- **PDF.js** - Client-side PDF text extraction
- **OpenAI API** - Optional LLM extraction
- **Jest** - Testing framework

---

## Privacy & Security

**Local mode (default):**
- All processing in browser
- No files uploaded to servers
- No data persistence

**OpenAI mode:**
- ⚠️ Document text sent to OpenAI (max 2,000,000 chars)
- Uses gpt-5.2 model with temperature 0 and max 20,000 tokens
- API key stored locally in `.env.local` only
- Subject to OpenAI's privacy policy

**Recommendation:** Use local mode for sensitive documents.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No shareholders found | Try OpenAI extraction or verify document has EXHIBIT A section |
| OpenAI toggle missing | Check `.env.local` exists and contains valid API key, restart server |
| Export shows wrong numbers | Numbers export without commas; use "Paste Special > Text" in Excel |
| PDF not processing | Ensure searchable PDF (not scanned), file under 10MB |

---

## Trade-offs & Design Decisions

1. **Client-side processing** - Privacy and simplicity over scalability
2. **Toggle approach** - Simple UX over hybrid complexity (could be improved)
3. **Strict validation** - Fewer false positives, may miss edge cases
4. **Single table extraction** - Clear results over comprehensive coverage
5. **No persistence** - Simplicity over features (easy to add backend later)

---

## Documentation

- **README.md** (this file) - Complete overview
- **QUICKSTART.md** - 2-minute setup guide
- **TESTING.md** - Comprehensive testing guide
- **env.example** - Environment configuration template

---

Built with engineering judgment, clean code, and extensibility in mind.
