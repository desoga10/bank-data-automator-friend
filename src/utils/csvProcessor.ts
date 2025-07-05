export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
}

const categories = [
  "Salary", "Rent", "Groceries", "Transport", "Utilities", 
  "Dining", "Subscriptions", "Miscellaneous"
];

export const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase();
  
  if (desc.includes("salary") || desc.includes("wage") || desc.includes("income") || desc.includes("payroll")) return "Salary";
  if (desc.includes("rent") || desc.includes("mortgage") || desc.includes("housing")) return "Rent";
  if (desc.includes("grocery") || desc.includes("supermarket") || desc.includes("food store") || desc.includes("walmart") || desc.includes("target")) return "Groceries";
  if (desc.includes("uber") || desc.includes("taxi") || desc.includes("transport") || desc.includes("gas") || desc.includes("fuel") || desc.includes("metro")) return "Transport";
  if (desc.includes("electric") || desc.includes("water") || desc.includes("utility") || desc.includes("internet") || desc.includes("phone")) return "Utilities";
  if (desc.includes("restaurant") || desc.includes("dining") || desc.includes("cafe") || desc.includes("pizza") || desc.includes("mcdonald")) return "Dining";
  if (desc.includes("netflix") || desc.includes("spotify") || desc.includes("subscription") || desc.includes("monthly") || desc.includes("amazon prime")) return "Subscriptions";
  
  return "Miscellaneous";
};

export const validateCsvFormat = (csvText: string): boolean => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return false; // Need at least header + 1 data row
  
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const requiredHeaders = ['date', 'description', 'amount'];
  
  return requiredHeaders.every(header => 
    headers.some(h => h.includes(header))
  );
};

export const parseCsv = (csvText: string): Transaction[] => {
  const lines = csvText.trim().split('\n');
  const transactions: Transaction[] = [];
  
  if (lines.length < 2) return transactions;
  
  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const dateIndex = headers.findIndex(h => h.includes('date'));
  const descriptionIndex = headers.findIndex(h => h.includes('description'));
  const amountIndex = headers.findIndex(h => h.includes('amount'));
  const categoryIndex = headers.findIndex(h => h.includes('category'));
  
  if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
    throw new Error('CSV must contain Date, Description, and Amount columns');
  }
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCsvLine(line);
    if (values.length <= Math.max(dateIndex, descriptionIndex, amountIndex)) continue;
    
    const date = parseDate(values[dateIndex]);
    const description = values[descriptionIndex].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
    const amount = parseAmount(values[amountIndex]);
    let category = categoryIndex !== -1 && values[categoryIndex] 
      ? values[categoryIndex].replace(/^"|"$/g, '').trim()
      : '';
    
    if (!category) {
      category = categorizeTransaction(description);
    }
    
    if (date && description && !isNaN(amount)) {
      transactions.push({ date, description, amount, category });
    }
  }
  
  return transactions;
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  values.push(current.trim());
  
  return values;
};

export const parseStatementText = (text: string): Transaction[] => {
  const lines = text.trim().split('\n');
  const transactions: Transaction[] = [];
  
  // Try multiple parsing strategies
  const parsedTransactions = [
    ...parseStructuredFormat(lines),
    ...parseTabularFormat(text),
  ];
  
  // Remove duplicates based on date, description, and amount
  const uniqueTransactions = parsedTransactions.filter((transaction, index, self) => 
    index === self.findIndex(t => 
      t.date === transaction.date && 
      t.description === transaction.description && 
      t.amount === transaction.amount
    )
  );
  
  return uniqueTransactions;
};

const parseStructuredFormat = (lines: string[]): Transaction[] => {
  const transactions: Transaction[] = [];
  let currentTransaction: Partial<Transaction> = {};
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('--')) continue;
    
    // Date parsing
    if (trimmedLine.startsWith('Date:')) {
      const dateStr = trimmedLine.replace('Date:', '').trim();
      const parsedDate = parseDate(dateStr);
      if (parsedDate) {
        currentTransaction.date = parsedDate;
      }
    }
    // Description parsing
    else if (trimmedLine.startsWith('Description:')) {
      currentTransaction.description = trimmedLine.replace('Description:', '').trim();
    }
    // Amount parsing
    else if (trimmedLine.startsWith('Amount:')) {
      const amountStr = trimmedLine.replace('Amount:', '').trim();
      const amount = parseAmount(amountStr);
      if (!isNaN(amount)) {
        currentTransaction.amount = amount;
        
        // If we have all required fields, create transaction
        if (currentTransaction.date && currentTransaction.description) {
          currentTransaction.category = categorizeTransaction(currentTransaction.description);
          transactions.push(currentTransaction as Transaction);
          currentTransaction = {};
        }
      }
    }
  }
  
  return transactions;
};

const parseTabularFormat = (text: string): Transaction[] => {
  const transactions: Transaction[] = [];
  const lines = text.split('\n');
  
  // Look for common table patterns
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/;
  const amountRegex = /[\$\-\+]?[\d,]+\.?\d{0,2}/;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const dateMatch = trimmedLine.match(dateRegex);
    const amountMatches = trimmedLine.match(new RegExp(amountRegex.source, 'g'));
    
    if (dateMatch && amountMatches && amountMatches.length > 0) {
      const date = parseDate(dateMatch[0]);
      const amount = parseAmount(amountMatches[amountMatches.length - 1]);
      
      if (date && !isNaN(amount)) {
        // Extract description (text between date and amount)
        const dateIndex = trimmedLine.indexOf(dateMatch[0]);
        const amountIndex = trimmedLine.lastIndexOf(amountMatches[amountMatches.length - 1]);
        
        let description = trimmedLine.substring(dateIndex + dateMatch[0].length, amountIndex).trim();
        description = description.replace(/\s+/g, ' '); // Clean up whitespace
        
        if (description) {
          transactions.push({
            date,
            description,
            amount,
            category: categorizeTransaction(description)
          });
        }
      }
    }
  }
  
  return transactions;
};

const parseDate = (dateStr: string): string | null => {
  try {
    // Remove any extra characters
    const cleanDate = dateStr.replace(/[^\d\/\-]/g, '');
    
    // Try different date formats
    const formats = [
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // MM/DD/YYYY or MM-DD-YYYY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/, // MM/DD/YY or MM-DD-YY
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
    ];
    
    for (const format of formats) {
      const match = cleanDate.match(format);
      if (match) {
        let [, part1, part2, part3] = match;
        
        // Determine if it's YYYY-MM-DD or MM/DD/YYYY format
        if (part1.length === 4) {
          // YYYY-MM-DD format
          return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
        } else {
          // MM/DD/YYYY or MM/DD/YY format
          let year = part3;
          if (year.length === 2) {
            year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
          }
          return `${year}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

const parseAmount = (amountStr: string): number => {
  try {
    // Remove currency symbols and clean up
    let cleanAmount = amountStr.replace(/[\$,\s]/g, '');
    
    // Handle negative amounts
    const isNegative = cleanAmount.includes('-') || cleanAmount.startsWith('(');
    cleanAmount = cleanAmount.replace(/[\-\(\)]/g, '');
    
    const amount = parseFloat(cleanAmount);
    return isNegative ? -amount : amount;
  } catch (error) {
    return NaN;
  }
};

export const convertToCsv = (transactions: Transaction[]): string => {
  const headers = ['Date', 'Description', 'Amount', 'Category'];
  const csvRows = [headers.join(',')];
  
  transactions.forEach(transaction => {
    const row = [
      transaction.date,
      `"${transaction.description.replace(/"/g, '""')}"`, // Escape quotes
      transaction.amount.toString(),
      transaction.category
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};