# Quick Start Guide

Get the application running in under 2 minutes.

**🔗 Live Demo:** https://document-extractor-three.vercel.app/  
**📦 Repository:** https://github.com/Nob20/DocumentExtractor

---

## Option 1: Use Live Demo (Instant)

Simply visit https://document-extractor-three.vercel.app/ and start uploading PDFs immediately!

---

## Option 2: Run Locally

### Essential Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the application**
   ```bash
   npm start
   ```

3. **Open in browser**
   - Automatically opens at `http://localhost:3000`
   - Upload a PDF document containing shareholder information

4. **View results**
   - Company name appears as the heading
   - Shareholder table displays names and share counts
   - Export to CSV or copy to clipboard

---

## Optional: Enable OpenAI

If local extraction doesn't work well:

1. **Create `.env.local`**
   ```bash
   cp env.example .env.local
   ```

2. **Add your OpenAI API key**
   - Get key from: https://platform.openai.com/api-keys
   - Edit `.env.local` and replace `sk-your-api-key-here`

3. **Restart server**
   ```bash
   npm start
   ```

4. **Toggle OpenAI in UI**
   - Switch will appear automatically

---

## Running Tests

```bash
npm test
```

Expected output:
```
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

---

## Troubleshooting

**No shareholders found?**
- Try OpenAI extraction
- Check document has "EXHIBIT A" or "RESTRICTED STOCK PURCHASERS" section

**OpenAI toggle missing?**
- Verify `.env.local` exists and contains valid API key
- Restart server with `npm start`

**Export issues?**
- Use "Paste Special > Text" in Excel
- Numbers are exported without commas to prevent parsing issues

---

For more details, see [README.md](README.md)
