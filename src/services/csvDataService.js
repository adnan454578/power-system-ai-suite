/**
 * CSV Data Service & Analytical Engine
 * Parses user-uploaded CSV files, computes column statistics,
 * and answers analytical questions for the AI Chatbot.
 */

export class CSVDataService {
  constructor() {
    this.currentDataset = null;
  }

  /**
   * Parse CSV string into headers, rows and numeric column summaries
   */
  parseCSV(csvText, fileName = 'uploaded_data.csv') {
    if (!csvText || !csvText.trim()) return null;

    const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return null;

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    // Parse rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length === headers.length) {
        const rowObj = {};
        headers.forEach((h, idx) => {
          const rawVal = values[idx];
          const numVal = Number(rawVal);
          rowObj[h] = isNaN(numVal) || rawVal === '' ? rawVal : numVal;
        });
        rows.push(rowObj);
      }
    }

    // Compute column statistics
    const columnStats = {};
    headers.forEach(h => {
      const numericValues = rows.map(r => r[h]).filter(v => typeof v === 'number' && !isNaN(v));
      if (numericValues.length > 0) {
        const sum = numericValues.reduce((a, b) => a + b, 0);
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const mean = sum / numericValues.length;
        
        // Std Dev
        const variance = numericValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / numericValues.length;
        const stdDev = Math.sqrt(variance);

        columnStats[h] = {
          type: 'number',
          count: numericValues.length,
          min: Number(min.toFixed(3)),
          max: Number(max.toFixed(3)),
          mean: Number(mean.toFixed(3)),
          sum: Number(sum.toFixed(3)),
          stdDev: Number(stdDev.toFixed(3))
        };
      } else {
        const uniqueValues = new Set(rows.map(r => r[h]));
        columnStats[h] = {
          type: 'string',
          count: rows.length,
          uniqueCount: uniqueValues.size,
          sample: rows.slice(0, 3).map(r => r[h])
        };
      }
    });

    this.currentDataset = {
      fileName,
      totalRows: rows.length,
      headers,
      rows,
      columnStats,
      uploadedAt: new Date().toLocaleTimeString()
    };

    return this.currentDataset;
  }

  getDataset() {
    return this.currentDataset;
  }

  clearDataset() {
    this.currentDataset = null;
  }

  /**
   * Evaluate natural language question against the uploaded dataset
   */
  queryDataset(question) {
    if (!this.currentDataset) {
      return {
        hasData: false,
        text: 'No CSV dataset has been uploaded yet. Please upload a CSV file using the upload button to analyze it.'
      };
    }

    const { fileName, totalRows, headers, columnStats, rows } = this.currentDataset;
    const q = question.toLowerCase();

    // 1. General Summary
    if (q.includes('summary') || q.includes('overview') || q.includes('dataset info') || q.includes('describe') || q.includes('what is in this file')) {
      let statsText = `📊 **Dataset Summary for: \`${fileName}\`**\n\n` +
                      `• **Total Rows:** \`${totalRows.toLocaleString()}\` records\n` +
                      `• **Columns:** ${headers.map(h => `\`${h}\``).join(', ')}\n\n` +
                      `**Key Column Metrics:**\n`;

      Object.entries(columnStats).forEach(([col, stat]) => {
        if (stat.type === 'number') {
          statsText += `• **${col}:** Min = \`${stat.min}\`, Max = \`${stat.max}\`, Mean = \`${stat.mean}\`, StdDev = \`${stat.stdDev}\`\n`;
        }
      });

      return {
        hasData: true,
        text: statsText,
        type: 'summary'
      };
    }

    // 2. Specific Column Query (e.g. "peak active power", "average voltage", "maximum current", "frequency minimum")
    let matchedColumn = null;
    for (const h of headers) {
      if (q.includes(h.toLowerCase()) || 
          (h.toLowerCase().includes('volt') && q.includes('volt')) ||
          (h.toLowerCase().includes('curr') && q.includes('curr')) ||
          (h.toLowerCase().includes('power') && (q.includes('power') || q.includes('mw') || q.includes('kw'))) ||
          (h.toLowerCase().includes('freq') && q.includes('freq')) ||
          (h.toLowerCase().includes('rpm') && q.includes('rpm')) ||
          (h.toLowerCase().includes('cost') && q.includes('cost'))) {
        matchedColumn = h;
        break;
      }
    }

    if (matchedColumn && columnStats[matchedColumn]?.type === 'number') {
      const stat = columnStats[matchedColumn];
      
      // Find row with max and min
      const maxRow = rows.find(r => r[matchedColumn] === stat.max);
      const minRow = rows.find(r => r[matchedColumn] === stat.min);

      return {
        hasData: true,
        text: `📈 **Analysis for Column: \`${matchedColumn}\`** (from \`${fileName}\`)\n\n` +
              `• **Maximum Value:** \`${stat.max}\`\n` +
              `• **Minimum Value:** \`${stat.min}\`\n` +
              `• **Average (Mean):** \`${stat.mean}\`\n` +
              `• **Standard Deviation:** \`±${stat.stdDev}\`\n` +
              `• **Sample Count:** \`${stat.count}\` records\n\n` +
              (maxRow ? `Highest record context: \`${JSON.stringify(maxRow)}\`\n` : ''),
        type: 'column_detail'
      };
    }

    // Default dataset response
    return {
      hasData: true,
      text: `The active dataset **\`${fileName}\`** contains **${totalRows} rows** and columns: ${headers.map(h => `\`${h}\``).join(', ')}.\n\n` +
            `You can ask specific questions like:\n` +
            `• *"What is the peak active power in the CSV?"*\n` +
            `• *"Summarize this dataset"*\n` +
            `• *"What is the average voltage and standard deviation?"*`,
      type: 'default'
    };
  }
}

export const csvService = new CSVDataService();
