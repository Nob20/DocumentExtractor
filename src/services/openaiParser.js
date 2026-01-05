export function isOpenAIAvailable() {
  return !!process.env.REACT_APP_OPENAI_API_KEY;
}

export async function parseWithOpenAI(text) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const model = 'gpt-5.2';
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const warnings = [];
  
  try {
    const maxLength = 2000000;
    const truncatedText = text.length > maxLength 
      ? text.substring(0, maxLength) + '\n\n[...truncated...]'
      : text;
    
    if (text.length > maxLength) {
      warnings.push('Document was truncated for OpenAI processing. Some shareholders may be missed.');
    }
    
  //move to another file
    const prompt = `Extract shareholder information from the following PDF text.

TASK:
1. Find the COMPANY NAME - extract ONLY the core name (e.g., "Lexsy Inc") WITHOUT legal jargon like "bylaws", "amended", "of Delaware", etc.
2. Look specifically for the "RESTRICTED STOCK PURCHASERS" section or similar shareholder table
3. Extract ONLY the names and share counts from that section
4. Return the data in the exact JSON format specified below

TEXT:
${truncatedText}

REQUIRED OUTPUT FORMAT (valid JSON only):
{
  "companyName": "Clean Company Name Only (e.g., 'Lexsy Inc')" or null,
  "shareholders": [
    {"name": "Full Name", "shares": 1000},
    {"name": "Another Name", "shares": 500}
  ],
  "confidence": "high" or "medium" or "low",
  "notes": "Any extraction concerns"
}

RULES:
- Return ONLY valid JSON, no other text
- Company name must be clean: NO bylaws, NO state names, NO legal jargon
- Focus on "Restricted Stock Purchasers" section
- Include only names with share counts from that section
- shares must be a positive integer
- If no shareholders found, return empty array

JSON Response:`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a precise data extraction assistant. Extract information exactly as requested and return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0,
        max_completion_tokens: 20000
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\s*$/g, '').trim();
    }
    
    const parsed = JSON.parse(jsonStr);
    
    if (!Array.isArray(parsed.shareholders)) {
      throw new Error('Shareholders field is not an array');
    }
    
    //modularize it
    const validShareholders = [];
    for (const sh of parsed.shareholders) {
      if (typeof sh.name === 'string' && typeof sh.shares === 'number' && sh.shares > 0) {
        validShareholders.push({
          name: sh.name.trim(),
          shares: sh.shares
        });
      }
    }
    
    if (parsed.confidence && parsed.confidence !== 'high') {
      warnings.push(`AI confidence: ${parsed.confidence}`);
    }
    
    if (parsed.notes) {
      warnings.push(`AI notes: ${parsed.notes}`);
    }
    
    warnings.push('AI extraction used. Please verify accuracy of results.');
    
    return {
      companyName: parsed.companyName || null,
      shareholders: validShareholders,
      warnings
    };
    
  } catch (error) {
    throw new Error(`OpenAI extraction failed: ${error.message}`);
  }
}

