import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).href;

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

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let extractedText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      extractedText += pageText + '\n';
    }
    
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF.');
  }
};

export const parseStatementText = (text: string): Transaction[] => {
  const lines = text.trim().split('\n');
  const transactions: Transaction[] = [];
  
  // Try multiple parsing strategies
  const parsedTransactions = [
    ...parseStructuredFormat(lines),
    ...parseTabularFormat(text),
    ...parseCommonBankFormats(text)
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

const parseCommonBankFormats = (text: string): Transaction[] => {
  const transactions: Transaction[] = [];
  
  // Add more sophisticated parsing for common bank statement formats
  // This is a placeholder for more advanced parsing logic
  
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

export const parseCsv = (csvText: string): Transaction[] => {
  const lines = csvText.trim().split('\n');
  const transactions: Transaction[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    if (values.length >= 4) {
      const date = values[0].trim();
      const description = values[1].replace(/^"|"$/g, '').replace(/""/g, '"'); // Unescape quotes
      const amount = parseFloat(values[2].trim());
      const category = values[3].trim();
      
      if (date && description && !isNaN(amount)) {
        transactions.push({ date, description, amount, category });
      }
    }
  }
  
  return transactions;
};