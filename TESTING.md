# Testing Guide

Complete guide for running and writing tests for the Document Data Extractor.

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm test -- --watch

# Run with verbose output
npm test -- --verbose

# Run without watch mode
npm test -- --watchAll=false

# Run with coverage report
npm test -- --coverage
```

### Run Specific Tests

```bash
# Run a specific test file
npm test heuristicParser.test.js

# Run tests matching a pattern
npm test --testNamePattern="company name"

# Run tests in a specific directory
npm test src/services/__tests__/
```

## Current Test Coverage

### What's Tested

**File:** `src/services/__tests__/heuristicParser.test.js`

✅ **Core Functionality**
- Company name extraction from document header
- Shareholder extraction from EXHIBIT A section
- Name cleaning (removes table header words)
- Share count validation (minimum threshold)
- Warning generation for edge cases

✅ **Data Validation**
- Rejects names with insufficient words
- Validates proper capitalization
- Ensures share counts are within valid range
- Handles three-word names correctly

✅ **Display Formatting**
- Number formatting with commas (e.g., 50,000)
- Percentage calculation
- Proper rounding

### Test Results

```
PASS  src/services/__tests__/heuristicParser.test.js
  parseShareholderInfo
    ✓ should extract company name from document (3 ms)
    ✓ should extract shareholders from EXHIBIT A section (1 ms)
    ✓ should remove header words from names (1 ms)
    ✓ should validate share counts (minimum threshold) (1 ms)
    ✓ should generate warnings when no shareholders found (1 ms)
  formatShareholderData
    ✓ should format share numbers with commas (1 ms)
    ✓ should calculate percentages correctly (1 ms)
  Edge Cases
    ✓ should handle three-word names correctly (1 ms)
    ✓ should reject names with insufficient words (1 ms)
    ✓ should accept names with proper capitalization (1 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        0.401 s
```

## Writing New Tests

### Test Structure

Tests use **Jest** testing framework with the following structure:

```javascript
import { parseShareholderInfo } from '../heuristicParser';

describe('Feature or Function Name', () => {
  it('should describe what the test does', () => {
    // Arrange: Set up test data
    const input = 'test data';
    
    // Act: Call the function
    const result = parseShareholderInfo(input);
    
    // Assert: Check the result
    expect(result.companyName).toBe('Expected Company');
    expect(result.shareholders).toHaveLength(2);
  });
});
```

### Common Jest Matchers

```javascript
// Equality
expect(value).toBe(expectedValue);           // Strict equality (===)
expect(value).toEqual(expectedValue);        // Deep equality (objects/arrays)

// Truthiness
expect(value).toBeTruthy();                  // Truthy value
expect(value).toBeFalsy();                   // Falsy value
expect(value).toBeNull();                    // Null
expect(value).toBeUndefined();               // Undefined

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeLessThan(10);
expect(number).toBeCloseTo(0.3, 5);          // Floating point

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain('item');
expect(array).toContainEqual({ name: 'John' });

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');
```

### Example: Adding a New Test

**Scenario:** Test that the parser handles hyphenated names

```javascript
// Add to src/services/__tests__/heuristicParser.test.js

describe('Edge Cases', () => {
  // ... existing tests ...
  
  it('should handle hyphenated names', () => {
    const text = `
      EXHIBIT A
      Mary-Jane Watson 10000 shares
      Peter Parker 20000 shares
    `;
    
    const result = parseShareholderInfo(text);
    
    expect(result.shareholders).toHaveLength(2);
    expect(result.shareholders[0].name).toBe('Mary-Jane Watson');
    expect(result.shareholders[0].shares).toBe(10000);
  });
});
```

## Testing Best Practices

### 1. Test One Thing at a Time

❌ **Bad:**
```javascript
it('should extract and format data', () => {
  const result = parseShareholderInfo(text);
  expect(result.companyName).toBe('Acme Corp.');
  expect(result.shareholders).toHaveLength(2);
  expect(formatShareholderData(result.shareholders)[0].shares).toBe('10,000');
});
```

✅ **Good:**
```javascript
it('should extract company name', () => {
  const result = parseShareholderInfo(text);
  expect(result.companyName).toBe('Acme Corp.');
});

it('should format share numbers with commas', () => {
  const formatted = formatShareholderData(shareholders);
  expect(formatted[0].shares).toBe('10,000');
});
```

### 2. Use Descriptive Test Names

❌ **Bad:** `it('works', () => { ... })`

✅ **Good:** `it('should extract shareholders from EXHIBIT A section', () => { ... })`

### 3. Test Edge Cases

Always test:
- Empty input
- Invalid input
- Boundary values (min/max)
- Special characters
- Unusual formatting

### 4. Keep Tests Independent

Each test should:
- Set up its own data
- Not depend on other tests
- Clean up after itself
- Be runnable in any order

## What Needs More Testing

### High Priority

1. **Component Tests**
   - `PDFUploader.jsx` - file validation, upload flow
   - `ExtractionResults.jsx` - table rendering, sorting, export
   - `ExtractionWarnings.jsx` - warning display logic

2. **PDF Extraction**
   - `pdfExtractor.js` - PDF.js integration
   - Multi-page documents
   - Various PDF formats

3. **OpenAI Parser**
   - `openaiParser.js` - API integration (mocked)
   - Error handling
   - Response validation

### Medium Priority

4. **Integration Tests**
   - Full upload → extract → display flow
   - CSV export functionality
   - Clipboard copy functionality

5. **Edge Cases**
   - Very large documents
   - Documents with no shareholder data
   - Malformed PDFs
   - Network errors (OpenAI)

### Example: Component Test

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import PDFUploader from '../PDFUploader';

describe('PDFUploader', () => {
  it('should show error for non-PDF files', () => {
    render(<PDFUploader onExtractionComplete={jest.fn()} />);
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText(/only PDF files/i)).toBeInTheDocument();
  });
});
```

## Mocking External Dependencies

### Mocking PDF.js

```javascript
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 3,
      getPage: jest.fn(() => Promise.resolve({
        getTextContent: jest.fn(() => Promise.resolve({
          items: [{ str: 'Mocked text' }]
        }))
      }))
    })
  }))
}));
```

### Mocking OpenAI API

```javascript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      choices: [{
        message: {
          content: JSON.stringify({
            companyName: 'Test Corp',
            shareholders: [{ name: 'John Doe', shares: 1000 }],
            confidence: 'high'
          })
        }
      }]
    })
  })
);
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
```

## Debugging Tests

### Run Tests with Node Inspector

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

### Add Debug Output

```javascript
it('should extract shareholders', () => {
  const result = parseShareholderInfo(text);
  
  console.log('Result:', JSON.stringify(result, null, 2)); // Debug
  
  expect(result.shareholders).toHaveLength(2);
});
```

### Run Single Test

```javascript
// Change 'it' to 'it.only' to run just this test
it.only('should extract shareholders', () => {
  // ...
});

// Or use 'describe.only' for a group
describe.only('parseShareholderInfo', () => {
  // ...
});
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests |
| `npm test -- --watch` | Watch mode |
| `npm test -- --coverage` | Coverage report |
| `npm test filename` | Run specific file |
| `npm test -- --verbose` | Detailed output |

---

For more information, see:
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

