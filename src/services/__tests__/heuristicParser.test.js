/**
 * Tests for Heuristic Parser
 * 
 * Run with: npm test
 * 
 * These tests focus on the most critical functionality:
 * 1. Company name extraction
 * 2. Shareholder extraction from standard formats
 * 3. Edge cases and validation
 */

import { parseShareholderInfo, formatShareholderData } from '../heuristicParser';

describe('heuristicParser - Core Functionality', () => {
  
  // TEST 1: Extract company name from real format (like "LEXSY, INC.")
  test('extracts clean company name from document header', () => {
    const text = 'LEXSY, INC. ACTION BY UNANIMOUS WRITTEN CONSENT...';
    
    const result = parseShareholderInfo(text);
    
    expect(result.companyName).toBe('LEXSY INC.');
  });

  // TEST 2: Extract shareholders from Exhibit A format (your real document)
  test('extracts shareholders from EXHIBIT A section', () => {
    const text = `
      EXHIBIT A
      
      Iryna Krutenko 54,000 shares
      Elena Ondar 450,000 shares
    `;
    
    const result = parseShareholderInfo(text);
    
    expect(result.shareholders).toHaveLength(2);
    expect(result.shareholders).toContainEqual({
      name: 'Iryna Krutenko',
      shares: 54000
    });
    expect(result.shareholders).toContainEqual({
      name: 'Elena Ondar',
      shares: 450000
    });
  });

  // TEST 3: Filters out table headers (like "Schedule")
  test('removes table header words from names', () => {
    const text = `
      EXHIBIT A
      Schedule Iryna Krutenko 54,000 shares
    `;
    
    const result = parseShareholderInfo(text);
    
    expect(result.shareholders[0].name).toBe('Iryna Krutenko');
    expect(result.shareholders[0].name).not.toContain('Schedule');
  });

  // TEST 4: Validates minimum share count
  test('rejects invalid small share counts (< 10)', () => {
    const text = `
      EXHIBIT A
      John Doe 5 shares
      Jane Smith 1000 shares
    `;
    
    const result = parseShareholderInfo(text);
    
    // Should only get Jane Smith (1000 shares), not John Doe (5 shares)
    expect(result.shareholders).toHaveLength(1);
    expect(result.shareholders[0].name).toBe('Jane Smith');
  });

  // TEST 5: Returns warnings when no shareholders found
  test('generates warnings when extraction fails', () => {
    const text = 'This is just plain text with no shareholders.';
    
    const result = parseShareholderInfo(text);
    
    expect(result.shareholders).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes('No shareholders found'))).toBe(true);
  });
});

describe('formatShareholderData - Display Formatting', () => {
  
  // TEST 6: Formats numbers with commas
  test('formats large numbers with comma separators', () => {
    const shareholders = [
      { name: 'John Doe', shares: 450000 }
    ];
    
    const formatted = formatShareholderData(shareholders);
    
    expect(formatted[0].shares).toBe('450,000');
  });

  // TEST 7: Calculates ownership percentages correctly
  test('calculates correct ownership percentages', () => {
    const shareholders = [
      { name: 'Majority Owner', shares: 75000 },
      { name: 'Minority Owner', shares: 25000 }
    ];
    
    const formatted = formatShareholderData(shareholders);
    
    expect(formatted[0].percentage).toBe('75.00%');
    expect(formatted[1].percentage).toBe('25.00%');
  });

  // TEST 8: Handles single shareholder (100%)
  test('shows 100% for single shareholder', () => {
    const shareholders = [
      { name: 'Sole Owner', shares: 100000 }
    ];
    
    const formatted = formatShareholderData(shareholders);
    
    expect(formatted[0].percentage).toBe('100.00%');
  });
});

describe('Edge Cases & Validation', () => {
  
  // TEST 9: Handles names with middle names or initials
  test('accepts names with three words or initials', () => {
    const text = `
      EXHIBIT A
      John Michael Smith 10000 shares
      Mary Johnson 5000 shares
    `;
    
    const result = parseShareholderInfo(text);
    
    expect(result.shareholders).toHaveLength(2);
    expect(result.shareholders[0].name).toBe('John Michael Smith');
    expect(result.shareholders[1].name).toBe('Mary Johnson');
  });

  // TEST 10: Rejects malformed entries
  test('rejects entries with insufficient name parts', () => {
    const text = `
      EXHIBIT A
      SingleName 10000 shares
      John Smith 10000 shares
    `;
    
    const result = parseShareholderInfo(text);
    
    // Should only get "John Smith" (2 words), not "SingleName" (1 word)
    expect(result.shareholders).toHaveLength(1);
    expect(result.shareholders[0].name).toBe('John Smith');
  });
});

/**
 * To run these tests:
 * 
 * 1. npm test
 * 2. npm test -- --watch (for watch mode)
 * 3. npm test -- --coverage (for coverage report)
 * 
 * Expected Results:
 * - All 10 tests should pass
 * - Coverage: Functions ~80%+, Lines ~75%+
 * 
 * These tests validate:
 * ✓ Real-world document format (LEXSY, INC.)
 * ✓ Exhibit A extraction pattern
 * ✓ Data cleaning (header words removal)
 * ✓ Validation rules (min shares, name format)
 * ✓ Display formatting (commas, percentages)
 * ✓ Edge cases (middle names, single owner)
 */

