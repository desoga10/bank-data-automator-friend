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

// Common header variations for different banks
const HEADER_MAPPINGS = {
  date: [
    'date', 'trans date', 'transaction date', 'value date', 'posting date',
    'trans. date', 'txn date', 'effective date', 'process date'
  ],
  description: [
    'description', 'remarks', 'narration', 'transaction details', 'details',
    'memo', 'reference', 'particulars', 'transaction description', 'desc'
  ],
  debit: [
    'debit', 'debit amount', 'withdrawal', 'outgoing', 'paid out',
    'debits', 'debit amt', 'withdrawal amount', 'outflow'
  ],
  credit: [
    'credit', 'credit amount', 'deposit', 'incoming', 'paid in',
    'credits', 'credit amt', 'deposit amount', 'inflow'
  ],
  amount: [
    'amount', 'transaction amount', 'txn amount', 'amt', 'value'
  ],
  category: [
    'category', 'type', 'transaction type', 'classification', 'class'
  ]
};

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

const findHeaderIndex = (headers: string[], mappings: string[]): number => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const mapping of mappings) {
    const index = normalizedHeaders.findIndex(h => 
      h === mapping || 
      h.includes(mapping) || 
      mapping.includes(h)
    );
    if (index !== -1) return index;
  }
  
  return -1;
};

const detectHeaderStructure = (headers: string[]) => {
  const structure = {
    dateIndex: findHeaderIndex(headers, HEADER_MAPPINGS.date),
    descriptionIndex: findHeaderIndex(headers, HEADER_MAPPINGS.description),
    debitIndex: findHeaderIndex(headers, HEADER_MAPPINGS.debit),
    creditIndex: findHeaderIndex(headers, HEADER_MAPPINGS.credit),
    amountIndex: findHeaderIndex(headers, HEADER_MAPPINGS.amount),
    categoryIndex: findHeaderIndex(headers, HEADER_MAPPINGS.category),
  };

  // Determine if we have separate debit/credit columns or a single amount column
  const hasSeparateColumns = structure.debitIndex !== -1 && structure.creditIndex !== -1;
  const hasSingleAmount = structure.amountIndex !== -1;

  return {
    ...structure,
    hasSeparateColumns,
    hasSingleAmount,
    isValid: structure.dateIndex !== -1 && structure.descriptionIndex !== -1 && 
             (hasSeparateColumns || hasSingleAmount)
  };
};

export const validateCsvFormat = (csvText: string): boolean => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return false; // Need at least header + 1 data row
  
  const headers = lines[0].split(',').map(h => h.trim());
  const structure = detectHeaderStructure(headers);
  
  return structure.isValid;
};

export const parseCsv = (csvText: string): Transaction[] => {
  const lines = csvText.trim().split('\n');
  const transactions: Transaction[] = [];
  
  if (lines.length < 2) return transactions;
  
  // Parse headers and detect structure
  const headers = lines[0].split(',').map(h => h.trim());
  const structure = detectHeaderStructure(headers);
  
  if (!structure.isValid) {
    throw new Error('CSV format not recognized. Please ensure your file has Date, Description, and Amount (or Debit/Credit) columns');
  }
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCsvLine(line);
    if (values.length <= Math.max(...Object.values(structure).filter(v => typeof v === 'number' && v !== -1))) continue;
    
    try {
      const date = parseDate(values[structure.dateIndex]);
      const description = cleanValue(values[structure.descriptionIndex]);
      
      let amount = 0;
      
      if (structure.hasSeparateColumns) {
        // Handle separate debit/credit columns
        const debitValue = structure.debitIndex !== -1 ? parseAmount(values[structure.debitIndex]) : 0;
        const creditValue = structure.creditIndex !== -1 ? parseAmount(values[structure.creditIndex]) : 0;
        
        // Credit is positive (income), Debit is negative (expense)
        amount = creditValue - debitValue;
      } else if (structure.hasSingleAmount) {
        // Handle single amount column
        amount = parseAmount(values[structure.amountIndex]);
      }
      
      let category = '';
      if (structure.categoryIndex !== -1 && values[structure.categoryIndex]) {
        category = cleanValue(values[structure.categoryIndex]);
      }
      
      if (!category) {
        category = categorizeTransaction(description);
      }
      
      if (date && description && !isNaN(amount)) {
        transactions.push({ date, description, amount, category });
      }
    } catch (error) {
      console.warn(`Skipping invalid row ${i + 1}:`, error);
      continue;
    }
  }
  
  return transactions;
};

const cleanValue = (value: string): string => {
  return value.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
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
      /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = cleanDate.match(format);
      if (match) {
        let [, part1, part2, part3] = match;
        
        // Determine if it's YYYY-MM-DD or MM/DD/YYYY format
        if (part1.length === 4) {
          // YYYY-MM-DD format
          return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
        } else if (part3.length === 4) {
          // MM/DD/YYYY or DD/MM/YYYY format - assume MM/DD/YYYY for US banks
          return `${part3}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
        } else {
          // MM/DD/YY or DD/MM/YY format
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
    if (!amountStr || amountStr.trim() === '') return 0;
    
    // Remove currency symbols and clean up
    let cleanAmount = amountStr.replace(/[\$,\s]/g, '');
    
    // Handle negative amounts
    const isNegative = cleanAmount.includes('-') || cleanAmount.startsWith('(');
    cleanAmount = cleanAmount.replace(/[\-\(\)]/g, '');
    
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount)) return 0;
    
    return isNegative ? -amount : amount;
  } catch (error) {
    return 0;
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

// Helper function to analyze CSV structure for debugging
export const analyzeCsvStructure = (csvText: string): any => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 1) return null;
  
  const headers = lines[0].split(',').map(h => h.trim());
  const structure = detectHeaderStructure(headers);
  
  return {
    headers,
    detectedStructure: structure,
    sampleRow: lines.length > 1 ? lines[1].split(',') : null
  };
};