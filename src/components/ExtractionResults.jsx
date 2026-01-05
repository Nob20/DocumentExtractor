import React, { useState, useMemo } from 'react';
import { formatShareholderData } from '../services/heuristicParser';

export default function ExtractionResults({ data }) {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const formattedShareholders = useMemo(() => {
    if (!data || !data.shareholders || data.shareholders.length === 0) return [];
    
    const formatted = formatShareholderData(data.shareholders);
    
    return [...formatted].sort((a, b) => {
      let aVal, bVal;
      
      if (sortField === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortField === 'shares') {
        aVal = parseInt(a.shares.replace(/,/g, ''), 10);
        bVal = parseInt(b.shares.replace(/,/g, ''), 10);
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [data, sortField, sortDirection]);

  if (!data) {
    return null;
  }

  const { companyName, shareholders } = data;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const totalShares = shareholders.reduce((sum, s) => sum + s.shares, 0);

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>{companyName || 'Company Shareholders'}</h2>
      </div>

      {formattedShareholders.length > 0 ? (
        <>
          <div className="table-container">
            <table className="shareholders-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Shareholder Name {getSortIcon('name')}
                  </th>
                  <th onClick={() => handleSort('shares')} className="sortable">
                    Number of Shares {getSortIcon('shares')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {formattedShareholders.map((shareholder, index) => (
                  <tr key={index}>
                    <td className="name-cell">{shareholder.name}</td>
                    <td className="number-cell">{shareholder.shares}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td><strong>Total</strong></td>
                  <td className="number-cell">
                    <strong>{totalShares.toLocaleString()}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="export-actions">
            <button 
              onClick={() => exportToCSV(formattedShareholders, companyName)}
              className="export-button"
            >
              📊 Export to CSV
            </button>
            <button 
              onClick={() => copyToClipboard(formattedShareholders)}
              className="export-button"
            >
              📋 Copy to Clipboard
            </button>
          </div>
        </>
      ) : (
        <div className="no-results">
          <p>❌ No shareholders found in document.</p>
          <p className="hint">
            The document may not contain a standard shareholder table, or the format may not be recognized.
          </p>
        </div>
      )}
    </div>
  );
}

function exportToCSV(shareholders, companyName) {
  const headers = ['Shareholder Name', 'Number of Shares'];
  const rows = shareholders.map(s => [
    s.name, 
    s.shares.replace(/,/g, '')
  ]);
  
  const csvContent = [
    companyName ? [`Company: ${companyName}`] : [],
    headers,
    ...rows
  ]
    .filter(row => row.length > 0)
    .map(row => row.join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `shareholders_${companyName || 'export'}_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function copyToClipboard(shareholders) {
  const text = shareholders
    .map(s => `${s.name}\t${s.shares.replace(/,/g, '')}`)
    .join('\n');
  
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard! Paste into Excel or Google Sheets.');
  }).catch(() => {
    alert('Failed to copy to clipboard');
  });
}

