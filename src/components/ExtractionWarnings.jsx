import React, { useState } from 'react';

export default function ExtractionWarnings({ warnings }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!warnings || warnings.length === 0) {
    return null;
  }

  const categorized = warnings.map(warning => {
    const lower = warning.toLowerCase();
    
    if (lower.includes('not found') || lower.includes('invalid') || lower.includes('failed')) {
      return { text: warning, severity: 'high' };
    } else if (lower.includes('verify') || lower.includes('may') || lower.includes('truncated')) {
      return { text: warning, severity: 'medium' };
    } else {
      return { text: warning, severity: 'low' };
    }
  });

  const highSeverity = categorized.filter(w => w.severity === 'high');
  const mediumSeverity = categorized.filter(w => w.severity === 'medium');
  const lowSeverity = categorized.filter(w => w.severity === 'low');

  return (
    <div className="warnings-container">
      <div className="warnings-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          ⚠️ Extraction Warnings ({warnings.length})
        </h3>
        <button className="toggle-button">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="warnings-content">
          {highSeverity.length > 0 && (
            <div className="warning-group">
              <h4 className="severity-high">🔴 Critical Issues:</h4>
              <ul>
                {highSeverity.map((w, i) => (
                  <li key={i} className="warning-item high">
                    {w.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mediumSeverity.length > 0 && (
            <div className="warning-group">
              <h4 className="severity-medium">🟡 Warnings:</h4>
              <ul>
                {mediumSeverity.map((w, i) => (
                  <li key={i} className="warning-item medium">
                    {w.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lowSeverity.length > 0 && (
            <div className="warning-group">
              <h4 className="severity-low">🔵 Info:</h4>
              <ul>
                {lowSeverity.map((w, i) => (
                  <li key={i} className="warning-item low">
                    {w.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="warning-footer">
            <p>
              <strong>Recommendation:</strong> Always verify extracted data against the original document.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

