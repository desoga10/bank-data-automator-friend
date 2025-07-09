export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  currency?: string;
}

const categories = [
  "Salary", "Rent", "Groceries", "Transport", "Utilities", 
  "Dining", "Subscriptions", "Miscellaneous", "Shopping", "Fitness", "Other Income"
];

// Comprehensive header mappings for different banks and formats
const HEADER_MAPPINGS = {
  date: [
    'date', 'trans date', 'transaction date', 'value date', 'posting date',
    'trans. date', 'txn date', 'effective date', 'process date', 'transaction_date',
    'trans_date', 'posting_date', 'value_date', 'effective_date'
  ],
  description: [
    'description', 'remarks', 'narration', 'transaction details', 'details',
    'memo', 'reference', 'particulars', 'transaction description', 'desc',
    'name/description', 'name', 'merchant', 'payee', 'transaction_details',
    'transaction_description', 'detail', 'narrative'
  ],
  debit: [
    'debit', 'debit amount', 'withdrawal', 'outgoing', 'paid out',
    'debits', 'debit amt', 'withdrawal amount', 'outflow', 'withdrawals',
    'money out', 'money_out', 'debit_amount', 'withdrawal_amount',
    'outgoing_amount', 'spent', 'expense'
  ],
  credit: [
    'credit', 'credit amount', 'deposit', 'incoming', 'paid in',
    'credits', 'credit amt', 'deposit amount', 'inflow', 'deposits',
    'money in', 'money_in', 'credit_amount', 'deposit_amount',
    'incoming_amount', 'received', 'income'
  ],
  amount: [
    'amount', 'transaction amount', 'txn amount', 'amt', 'value',
    'transaction_amount', 'txn_amount', 'net_amount', 'total'
  ],
  category: [
    'category', 'type', 'transaction type', 'classification', 'class',
    'transaction_type', 'category_type', 'expense_type'
  ],
  balance: [
    'balance', 'running balance', 'account balance', 'current balance',
    'balance_amount', 'running_balance', 'account_balance'
  ],
  reference: [
    'reference', 'ref', 'transaction ref', 'reference number', 'ref no',
    'transaction_ref', 'ref_no', 'reference_number'
  ],
  time: [
    'time', 'timestamp', 'transaction time', 'time_stamp'
  ],
  currency: [
    'currency', 'curr', 'currency_code'
  ],
  status: [
    'status', 'transaction status', 'state', 'transaction_status'
  ]
};

// Currency symbols and their codes
const CURRENCY_SYMBOLS = {
  '$': 'USD',
  '£': 'GBP',
  '€': 'EUR',
  '¥': 'JPY',
  '₹': 'INR',
  '₽': 'RUB',
  '₩': 'KRW',
  'C$': 'CAD',
  'A$': 'AUD',
  'R$': 'BRL',
  '₦': 'NGN',
  '₵': 'GHS',
  '₨': 'PKR'
};

// Date format patterns with regex
const DATE_PATTERNS = [
  // YYYY-MM-DD (ISO format)
  { regex: /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, format: 'YYYY_MM_DD' },
  // DD/MM/YYYY, MM/DD/YYYY
  { regex: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, format: 'DMY_or_MDY' },
  // DD-MMM-YYYY (01-May-2025)
  { regex: /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/, format: 'DD_MMM_YYYY' },
  // DD/MM/YY, MM/DD/YY
  { regex: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/, format: 'DMY_or_MDY_short' },
  // MMM DD, YYYY (May 01, 2025)
  { regex: /^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/, format: 'MMM_DD_YYYY' },
  // DD MMM YYYY (01 May 2025)
  { regex: /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/, format: 'DD_MMM_YYYY_spaced' }
];

const MONTH_NAMES = {
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
  'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
  'january': '01', 'february': '02', 'march': '03', 'april': '04', 'june': '06',
  'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12'
};

export const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase();
  
  // Enhanced categorization with more patterns
  if (desc.includes("salary") || desc.includes("wage") || desc.includes("income") || desc.includes("payroll") || desc.includes("direct dep") || desc.includes("monthly pay") || desc.includes("salary payment")) return "Salary";
  if (desc.includes("rent") || desc.includes("mortgage") || desc.includes("housing") || desc.includes("monthly rent")) return "Rent";
  if (desc.includes("grocery") || desc.includes("supermarket") || desc.includes("food store") || desc.includes("walmart") || desc.includes("target") || desc.includes("whole foods") || desc.includes("kroger")) return "Groceries";
  if (desc.includes("uber") || desc.includes("taxi") || desc.includes("transport") || desc.includes("gas") || desc.includes("fuel") || desc.includes("metro") || desc.includes("lyft") || desc.includes("gas station")) return "Transport";
  if (desc.includes("electric") || desc.includes("water") || desc.includes("utility") || desc.includes("internet") || desc.includes("phone") || desc.includes("electricity bill") || desc.includes("water bill") || desc.includes("internet subscription")) return "Utilities";
  if (desc.includes("restaurant") || desc.includes("dining") || desc.includes("cafe") || desc.includes("pizza") || desc.includes("mcdonald") || desc.includes("starbucks") || desc.includes("chipotle")) return "Dining";
  if (desc.includes("netflix") || desc.includes("spotify") || desc.includes("subscription") || desc.includes("monthly") || desc.includes("amazon prime") || desc.includes("youtube premium")) return "Subscriptions";
  if (desc.includes("gym") || desc.includes("fitness") || desc.includes("yoga") || desc.includes("gym membership") || desc.includes("yoga class")) return "Fitness";
  if (desc.includes("amazon") || desc.includes("ebay") || desc.includes("shopping") || desc.includes("target") || desc.includes("walmart")) return "Shopping";
  if (desc.includes("bonus") || desc.includes("gift") || desc.includes("freelance") || desc.includes("other income") || desc.includes("gift received") || desc.includes("freelance payment")) return "Other Income";
  
  return "Miscellaneous";
};

const findHeaderIndex = (headers: string[], mappings: string[]): number => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
  
  for (const mapping of mappings) {
    const normalizedMapping = mapping.toLowerCase().replace(/[^a-z0-9]/g, '');
    const index = normalizedHeaders.findIndex(h => 
      h === normalizedMapping || 
      h.includes(normalizedMapping) || 
      normalizedMapping.includes(h)
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
    balanceIndex: findHeaderIndex(headers, HEADER_MAPPINGS.balance),
    referenceIndex: findHeaderIndex(headers, HEADER_MAPPINGS.reference),
    timeIndex: findHeaderIndex(headers, HEADER_MAPPINGS.time),
    currencyIndex: findHeaderIndex(headers, HEADER_MAPPINGS.currency),
    statusIndex: findHeaderIndex(headers, HEADER_MAPPINGS.status),
  };

  // Determine if we have separate debit/credit columns or a single amount column
  const hasSeparateColumns = structure.debitIndex !== -1 && structure.creditIndex !== -1;
  const hasSingleAmount = structure.amountIndex !== -1;
  const hasBalance = structure.balanceIndex !== -1;

  return {
    ...structure,
    hasSeparateColumns,
    hasSingleAmount,
    hasBalance,
    isValid: structure.dateIndex !== -1 && structure.descriptionIndex !== -1 && 
             (hasSeparateColumns || hasSingleAmount)
  };
};

// Detect currency from text or amount string
const detectCurrency = (text: string, currencyColumn?: string): string => {
  // If there's a currency column, use that
  if (currencyColumn && currencyColumn.trim()) {
    return currencyColumn.trim().toUpperCase();
  }
  
  // Look for currency symbols in the text
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(symbol)) {
      return code;
    }
  }
  
  // Default to USD if no currency detected
  return 'USD';
};

// Enhanced date parsing with multiple format support
const parseDate = (dateStr: string): string | null => {
  try {
    if (!dateStr || dateStr.trim() === '') {
      console.warn('Empty date string');
      return null;
    }
    
    const cleanDate = dateStr.trim();
    console.log(`Parsing date: "${cleanDate}"`);
    
    // Try each date pattern
    for (const pattern of DATE_PATTERNS) {
      const match = cleanDate.match(pattern.regex);
      if (match) {
        const result = formatDateFromMatch(match, pattern.format);
        console.log(`Date parsed: "${cleanDate}" -> "${result}" using pattern: ${pattern.format}`);
        return result;
      }
    }
    
    // Fallback: try native Date parsing
    const parsedDate = new Date(cleanDate);
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      const result = `${year}-${month}-${day}`;
      console.log(`Date parsed (fallback): "${cleanDate}" -> "${result}"`);
      return result;
    }
    
    console.warn('Failed to parse date:', cleanDate);
    return null;
  } catch (error) {
    console.warn('Date parsing error:', error, 'for:', dateStr);
    return null;
  }
};

const formatDateFromMatch = (match: RegExpMatchArray, format: string): string => {
  const [, part1, part2, part3] = match;
  
  switch (format) {
    case 'YYYY_MM_DD':
      return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
      
    case 'DD_MMM_YYYY':
    case 'DD_MMM_YYYY_spaced':
      const month = MONTH_NAMES[part2.toLowerCase()] || '01';
      return `${part3}-${month}-${part1.padStart(2, '0')}`;
      
    case 'MMM_DD_YYYY':
      const monthNum = MONTH_NAMES[part1.toLowerCase()] || '01';
      return `${part3}-${monthNum}-${part2.padStart(2, '0')}`;
      
    case 'DMY_or_MDY':
      // For your specific format (2024-08-04), this is already YYYY-MM-DD
      // But handle MM/DD/YYYY vs DD/MM/YYYY ambiguity
      if (parseInt(part1) > 12) {
        // DD/MM/YYYY
        return `${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
      } else if (parseInt(part2) > 12) {
        // MM/DD/YYYY  
        return `${part3}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
      } else {
        // Ambiguous - assume MM/DD/YYYY for US format
        return `${part3}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
      }
      
    case 'DMY_or_MDY_short':
      let year = part3;
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      // Same heuristic as above
      if (parseInt(part1) > 12) {
        return `${year}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
      } else {
        return `${year}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
      }
      
    default:
      return `${part3}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
  }
};

// Enhanced amount parsing with currency support
const parseAmount = (amountStr: string): number => {
  try {
    if (!amountStr || amountStr.trim() === '') {
      console.warn('Empty amount string');
      return 0;
    }
    
    const originalAmount = amountStr;
    
    // Remove currency symbols, spaces, and other non-numeric characters except decimal points and signs
    let cleanAmount = amountStr.replace(/[\$£€¥₹₽₩,\s]/g, '');
    
    // Handle negative amounts (-, (), or leading -)
    const isNegative = cleanAmount.includes('-') || cleanAmount.startsWith('(') || cleanAmount.endsWith(')');
    cleanAmount = cleanAmount.replace(/[\-\(\)]/g, '');
    
    // Handle positive signs
    cleanAmount = cleanAmount.replace(/^\+/, '');
    
    // Handle cases where there are multiple decimal points (e.g., thousands separator confusion)
    if ((cleanAmount.match(/\./g) || []).length > 1) {
      // Remove all but the last decimal point (treat others as thousands separators)
      const parts = cleanAmount.split('.');
      const lastPart = parts.pop();
      cleanAmount = parts.join('') + '.' + lastPart;
    }
    
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount)) {
      console.warn('Failed to parse amount:', originalAmount, '-> cleaned:', cleanAmount);
      return 0;
    }
    
    const result = isNegative ? -amount : amount;
    console.log(`Parsed amount: "${originalAmount}" -> ${result}`);
    return result;
  } catch (error) {
    console.warn('Amount parsing error:', error, 'for:', amountStr);
    return 0;
  }
};

// Parse sectional format (Format 5: International Bank PDF)
const parseSectionalFormat = (text: string): Transaction[] => {
  const transactions: Transaction[] = [];
  const sections = text.split(/(?=Date:|^Date:)/m).filter(section => section.trim());
  
  for (const section of sections) {
    const lines = section.split('\n').map(line => line.trim()).filter(line => line);
    
    let date = '';
    let description = '';
    let amount = 0;
    let currency = 'USD';
    
    for (const line of lines) {
      if (line.startsWith('Date:')) {
        const dateStr = line.replace('Date:', '').trim();
        date = parseDate(dateStr) || '';
      } else if (line.startsWith('Details:') || line.startsWith('Description:')) {
        description = line.replace(/^(Details|Description):/, '').trim();
      } else if (line.startsWith('Amount:')) {
        const amountStr = line.replace('Amount:', '').trim();
        currency = detectCurrency(amountStr);
        amount = parseAmount(amountStr);
      }
    }
    
    if (date && description && !isNaN(amount)) {
      transactions.push({
        date,
        description,
        amount,
        category: categorizeTransaction(description),
        currency
      });
    }
  }
  
  return transactions;
};

// Parse headerless format (Format 3: U.S. Bank PDF Style)
const parseHeaderlessFormat = (text: string): Transaction[] => {
  const transactions: Transaction[] = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  // Pattern for: DATE   TYPE   DESCRIPTION   AMOUNT
  const headerlessPattern = /^(\d{2}\/\d{2}\/\d{4})\s+([A-Z\s]+?)\s+(.+?)\s+([\+\-]?\$?[\d,]+\.?\d{0,2})$/;
  
  for (const line of lines) {
    const match = line.trim().match(headerlessPattern);
    if (match) {
      const [, dateStr, type, description, amountStr] = match;
      
      const date = parseDate(dateStr);
      const amount = parseAmount(amountStr);
      const currency = detectCurrency(amountStr);
      
      if (date && !isNaN(amount)) {
        transactions.push({
          date,
          description: `${type.trim()} ${description.trim()}`.trim(),
          amount,
          category: categorizeTransaction(description),
          currency
        });
      }
    }
  }
  
  return transactions;
};

// Enhanced CSV line parsing with better quote handling
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

const cleanValue = (value: string): string => {
  return value.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
};

export const validateCsvFormat = (csvText: string): boolean => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return false; // Need at least header + 1 data row
  
  // Check if it's a sectional format
  if (csvText.includes('Date:') && csvText.includes('Amount:')) {
    return true;
  }
  
  // Check if it's headerless format
  const headerlessPattern = /^\d{2}\/\d{2}\/\d{4}\s+[A-Z\s]+.+[\+\-]?\$?[\d,]+\.?\d{0,2}$/;
  if (lines.some(line => headerlessPattern.test(line.trim()))) {
    return true;
  }
  
  // Check standard CSV format
  const headers = lines[0].split(',').map(h => h.trim());
  const structure = detectHeaderStructure(headers);
  
  return structure.isValid;
};

export const parseCsv = (csvText: string): Transaction[] => {
  const lines = csvText.trim().split('\n');
  let transactions: Transaction[] = [];
  
  console.log(`🔍 Processing CSV with ${lines.length} lines`);
  console.log('📄 First few lines:', lines.slice(0, 3));
  
  if (lines.length < 1) return transactions;
  
  // Try sectional format first (Format 5)
  if (csvText.includes('Date:') && csvText.includes('Amount:')) {
    transactions = parseSectionalFormat(csvText);
    if (transactions.length > 0) return transactions;
  }
  
  // Try headerless format (Format 3)
  const headerlessPattern = /^\d{2}\/\d{2}\/\d{4}\s+[A-Z\s]+.+[\+\-]?\$?[\d,]+\.?\d{0,2}$/;
  if (lines.some(line => headerlessPattern.test(line.trim()))) {
    transactions = parseHeaderlessFormat(csvText);
    if (transactions.length > 0) return transactions;
  }
  
  // Standard CSV parsing (Formats 1, 2, 4, 6)
  if (lines.length < 2) return transactions;
  
  // Parse headers and detect structure
  const headers = lines[0].split(',').map(h => h.trim());
  const structure = detectHeaderStructure(headers);
  
  if (!structure.isValid) {
    throw new Error('CSV format not recognized. Please ensure your file has Date, Description, and Amount (or Debit/Credit) columns');
  }
  
  console.log('🏗️ Detected CSV structure:', structure);
  console.log('📊 Headers:', headers);
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCsvLine(line);
    
    // Skip if we don't have enough columns
    const requiredIndices = [structure.dateIndex, structure.descriptionIndex];
    if (structure.hasSeparateColumns) {
      requiredIndices.push(structure.debitIndex, structure.creditIndex);
    } else {
      requiredIndices.push(structure.amountIndex);
    }
    
    const maxIndex = Math.max(...requiredIndices.filter(idx => idx !== -1));
    if (values.length <= maxIndex) {
      console.warn(`Skipping row ${i + 1}: insufficient columns`, values);
      continue;
    }
    
    try {
      const date = parseDate(cleanValue(values[structure.dateIndex]));
      const description = cleanValue(values[structure.descriptionIndex]);
      
      let amount = 0;
      let currency = 'USD';
      
      if (structure.hasSeparateColumns) {
        // Handle separate debit/credit columns
        const debitValue = structure.debitIndex !== -1 ? parseAmount(cleanValue(values[structure.debitIndex])) : 0;
        const creditValue = structure.creditIndex !== -1 ? parseAmount(cleanValue(values[structure.creditIndex])) : 0;
        
        // Credit is positive (income), Debit is negative (expense)
        amount = creditValue - debitValue;
        
        // Detect currency from debit or credit columns
        const debitStr = structure.debitIndex !== -1 ? cleanValue(values[structure.debitIndex]) : '';
        const creditStr = structure.creditIndex !== -1 ? cleanValue(values[structure.creditIndex]) : '';
        currency = detectCurrency(debitStr + creditStr);
      } else if (structure.hasSingleAmount) {
        // Handle single amount column - this is your file format
        const amountStr = cleanValue(values[structure.amountIndex]);
        console.log(`💰 Processing amount at index ${structure.amountIndex}: "${amountStr}"`);
        amount = parseAmount(amountStr);
        currency = detectCurrency(amountStr);
        console.log(`💰 Final amount: ${amount}, currency: ${currency}`);
      }
      
      // Get currency from currency column if available
      if (structure.currencyIndex !== -1 && values[structure.currencyIndex]) {
        currency = detectCurrency('', cleanValue(values[structure.currencyIndex]));
      }
      
      let category = '';
      if (structure.categoryIndex !== -1 && values[structure.categoryIndex]) {
        category = cleanValue(values[structure.categoryIndex]);
      }
      
      if (!category) {
        category = categorizeTransaction(description);
      }
      
      console.log(`🔍 Before creating transaction - amount: ${amount}, isNaN(amount): ${isNaN(amount)}`);
      
      if (date && description && !isNaN(amount)) {
        const transaction = { 
          date, 
          description, 
          amount, 
          category,
          currency 
        };
        console.log(`✅ Created transaction object:`, transaction);
        transactions.push(transaction);
        console.log(`✅ Valid transaction ${transactions.length}:`, transaction);
      } else {
        console.warn(`Skipping invalid transaction at row ${i + 1}:`, { 
          date, 
          description, 
          amount, 
          rawDate: values[structure.dateIndex],
          rawDescription: values[structure.descriptionIndex],
          rawAmount: structure.hasSingleAmount ? values[structure.amountIndex] : 
                     `Debit: ${structure.debitIndex !== -1 ? values[structure.debitIndex] : 'N/A'}, Credit: ${structure.creditIndex !== -1 ? values[structure.creditIndex] : 'N/A'}`
        });
      }
    } catch (error) {
      console.warn(`Skipping invalid row ${i + 1}:`, error);
      continue;
    }
  }
  
  console.log(`Successfully parsed ${transactions.length} transactions`);
  return transactions;
};

export const parseStatementText = (text: string): Transaction[] => {
  const lines = text.trim().split('\n');
  const transactions: Transaction[] = [];
  
  // Try multiple parsing strategies
  const parsedTransactions = [
    ...parseStructuredFormat(lines),
    ...parseTabularFormat(text),
    ...parseSectionalFormat(text),
    ...parseHeaderlessFormat(text),
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
      const currency = detectCurrency(amountStr);
      if (!isNaN(amount)) {
        currentTransaction.amount = amount;
        currentTransaction.currency = currency;
        
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
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\d{1,2}-[A-Za-z]{3}-\d{4})/;
  const amountRegex = /[\$\-\+]?[\d,]+\.?\d{0,2}/;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const dateMatch = trimmedLine.match(dateRegex);
    const amountMatches = trimmedLine.match(new RegExp(amountRegex.source, 'g'));
    
    if (dateMatch && amountMatches && amountMatches.length > 0) {
      const date = parseDate(dateMatch[0]);
      const amount = parseAmount(amountMatches[amountMatches.length - 1]);
      const currency = detectCurrency(amountMatches[amountMatches.length - 1]);
      
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
            category: categorizeTransaction(description),
            currency
          });
        }
      }
    }
  }
  
  return transactions;
};

export const convertToCsv = (transactions: Transaction[]): string => {
  const headers = ['Date', 'Description', 'Amount', 'Category', 'Currency'];
  const csvRows = [headers.join(',')];
  
  transactions.forEach(transaction => {
    const row = [
      transaction.date,
      `"${transaction.description.replace(/"/g, '""')}"`, // Escape quotes
      transaction.amount.toString(),
      transaction.category,
      transaction.currency || 'USD'
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};

// Helper function to analyze CSV structure for debugging
export const analyzeCsvStructure = (csvText: string): any => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 1) return null;
  
  // Check for different formats
  const formatDetection = {
    isSectional: csvText.includes('Date:') && csvText.includes('Amount:'),
    isHeaderless: /^\d{2}\/\d{2}\/\d{4}\s+[A-Z\s]+.+[\+\-]?\$?[\d,]+\.?\d{0,2}$/.test(lines[0]),
    isStandardCsv: lines[0].includes(',')
  };
  
  if (formatDetection.isStandardCsv) {
    const headers = lines[0].split(',').map(h => h.trim());
    const structure = detectHeaderStructure(headers);
    
    return {
      format: 'Standard CSV',
      headers,
      detectedStructure: structure,
      sampleRow: lines.length > 1 ? lines[1].split(',') : null,
      formatDetection
    };
  }
  
  return {
    format: formatDetection.isSectional ? 'Sectional' : 
            formatDetection.isHeaderless ? 'Headerless' : 'Unknown',
    formatDetection,
    sampleLines: lines.slice(0, 3)
  };
};