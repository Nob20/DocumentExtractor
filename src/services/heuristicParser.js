export function parseShareholderInfo(text) {
  const warnings = [];
  
  const companyName = extractCompanyName(text);
  if (!companyName) {
    warnings.push('Could not automatically detect company name. Please verify results.');
  }
  
  const shareholders = extractShareholders(text);
  
  if (shareholders.length === 0) {
    warnings.push('No shareholders found. The document may not contain a "Restricted Stock Purchasers" table, or the table format is not recognized.');
    
    const lowerText = text.toLowerCase();
    if (lowerText.includes('restricted') && lowerText.includes('stock')) {
      warnings.push('Found "Restricted Stock" text but could not extract data. The table format may be unusual.');
    }
  }
  
  return { companyName, shareholders, warnings };
}

function extractCompanyName(text) {
  const firstPart = text.substring(0, 100).trim();
  const beforeAction = firstPart.split(/ACTION|CONSENT|BOARD/i)[0].trim();
  
  if (beforeAction.length > 5 && beforeAction.length < 50 && /Inc\.|LLC|Corp\./i.test(beforeAction)) {
    let companyName = beforeAction.replace(/,\s*(?=Inc\.|LLC|Corp\.)/i, ' ').trim();
    return companyName;
  }
  
  const firstLine = text.split('\n')[0].trim();
  if (firstLine.length < 100 && /Inc\.|LLC|Corp\./i.test(firstLine)) {
    let companyName = firstLine.replace(/,\s*(?=Inc\.|LLC|Corp\.)/i, ' ').trim();
    if (companyName.length > 5 && companyName.length < 50) {
      return companyName;
    }
  }
  
  return null;
}

function extractShareholders(text) {
  const shareholderSection = findShareholderSection(text);
  if (shareholderSection) {
    const extracted = extractFromSection(shareholderSection);
    if (extracted.length > 0) {
      return extracted;
    }
  }
  
  return [];
}

function findShareholderSection(text) {
  const lowerText = text.toLowerCase();
  
  const exhibitIndex = lowerText.indexOf('exhibit a');
  if (exhibitIndex !== -1) {
    const section = text.substring(exhibitIndex, Math.min(text.length, exhibitIndex + 10000));
    return section;
  }
  
  const scheduleIndex = lowerText.indexOf('schedule a');
  if (scheduleIndex !== -1) {
    return text.substring(scheduleIndex, Math.min(text.length, scheduleIndex + 10000));
  }
  
  const restrictedIndex = lowerText.indexOf('restricted stock purchasers');
  if (restrictedIndex !== -1) {
    return text.substring(restrictedIndex, Math.min(text.length, restrictedIndex + 10000));
  }
  
  return null;
}

function extractFromSection(section) {
  const shareholders = [];
  
  const nameSharePattern = /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+([\d,]+)\s*shares?/gi;
  const excludeWords = ['schedule', 'vesting', 'stock', 'plan', 'price', 'name', 'shares'];
  
  let match;
  while ((match = nameSharePattern.exec(section)) !== null) {
    let name = match[1].trim();
    const sharesStr = match[2].replace(/,/g, '');
    const shares = parseInt(sharesStr, 10);
    
    const nameParts = name.split(/\s+/);
    const cleanedParts = nameParts.filter(part => !excludeWords.includes(part.toLowerCase()));
    const cleanedName = cleanedParts.join(' ').trim();
    
    if (cleanedName !== name) {
      name = cleanedName;
    }
    
    if (name && isValidShareholder(name, shares)) {
      if (!shareholders.find(s => s.name === name)) {
        shareholders.push({ name, shares });
      }
    }
  }
  
  return shareholders;
}

function isValidShareholder(name, shares) {
  const words = name.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length < 2) {
    return false;
  }
  
  if (words.some(w => w.length < 2)) {
    return false;
  }
  
  if (name.length > 50) {
    return false;
  }
  
  const hasProperCapitalization = words.every(w => 
    /^[A-Z][a-z]+$/.test(w) || /^[A-Z]+$/.test(w) || /^[A-Z]\.$/.test(w)
  );
  
  if (!hasProperCapitalization) {
    return false;
  }
  
  if (shares < 10) {
    return false;
  }
  
  if (shares > 100000000) {
    return false;
  }
  
  return true;
}

export function formatShareholderData(shareholders) {
  const totalShares = shareholders.reduce((sum, s) => sum + s.shares, 0);
  
  return shareholders.map(s => ({
    name: s.name,
    shares: s.shares.toLocaleString(),
    percentage: totalShares > 0 
      ? `${((s.shares / totalShares) * 100).toFixed(2)}%` 
      : 'N/A'
  }));
}
