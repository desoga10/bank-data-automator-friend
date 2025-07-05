import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from 'pdfjs-dist';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
}

// Set up PDF.js worker using the npm package
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

const categories = [
  "Salary", "Rent", "Groceries", "Transport", "Utilities", 
  "Dining", "Subscriptions", "Miscellaneous"
];

const extractTextFromPDF = async (file: File): Promise<string> => {
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
};

const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase();
  
  if (desc.includes("salary") || desc.includes("wage") || desc.includes("income")) return "Salary";
  if (desc.includes("rent") || desc.includes("mortgage")) return "Rent";
  if (desc.includes("grocery") || desc.includes("supermarket") || desc.includes("food store")) return "Groceries";
  if (desc.includes("uber") || desc.includes("taxi") || desc.includes("transport") || desc.includes("gas") || desc.includes("fuel")) return "Transport";
  if (desc.includes("electric") || desc.includes("water") || desc.includes("utility") || desc.includes("internet")) return "Utilities";
  if (desc.includes("restaurant") || desc.includes("dining") || desc.includes("cafe") || desc.includes("pizza")) return "Dining";
  if (desc.includes("netflix") || desc.includes("spotify") || desc.includes("subscription") || desc.includes("monthly")) return "Subscriptions";
  
  return "Miscellaneous";
};

const convertToCsv = (transactions: Transaction[]): string => {
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

const parseCsv = (csvText: string): Transaction[] => {
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

const parseStatementText = (text: string): Transaction[] => {
  const lines = text.trim().split('\n');
  const transactions: Transaction[] = [];
  
  let currentTransaction: Partial<Transaction> = {};
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('--')) continue;
    
    // Date parsing
    if (trimmedLine.startsWith('Date:')) {
      const dateStr = trimmedLine.replace('Date:', '').trim();
      // Convert MM/DD/YYYY to YYYY-MM-DD
      const [month, day, year] = dateStr.split('/');
      if (month && day && year) {
        currentTransaction.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Description parsing
    else if (trimmedLine.startsWith('Description:')) {
      currentTransaction.description = trimmedLine.replace('Description:', '').trim();
    }
    
    // Amount parsing
    else if (trimmedLine.startsWith('Amount:')) {
      const amountStr = trimmedLine.replace('Amount:', '').trim();
      const amount = parseFloat(amountStr);
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

export const FinancialAssistant = () => {
  const [statementText, setStatementText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [csvData, setCsvData] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleParsePDF = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Step 1: Extract text from PDF
      const extractedText = await extractTextFromPDF(selectedFile);
      const parsedTransactions = parseStatementText(extractedText);
      
      if (parsedTransactions.length === 0) {
        toast({
          title: "No transactions found",
          description: "Could not find transactions in the PDF. Please check the file format.",
          variant: "destructive",
        });
        return;
      }
      
      // Step 2: Convert to CSV
      const csvContent = convertToCsv(parsedTransactions);
      setCsvData(csvContent);
      
      // Step 3: Parse CSV data for analysis
      const csvTransactions = parseCsv(csvContent);
      setTransactions(csvTransactions);
      
      toast({
        title: "PDF processed via CSV",
        description: `Converted to CSV and found ${csvTransactions.length} transaction${csvTransactions.length !== 1 ? 's' : ''}.`,
      });
    } catch (error) {
      toast({
        title: "PDF processing error",
        description: "There was an error processing your PDF file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCsv = () => {
    if (!csvData) return;
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleParseStatement = async () => {
    if (!statementText.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste your bank statement data first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate processing delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const parsedTransactions = parseStatementText(statementText);
      
      if (parsedTransactions.length === 0) {
        toast({
          title: "No transactions found",
          description: "Please check your statement format and try again.",
          variant: "destructive",
        });
      } else {
        setTransactions(parsedTransactions);
        toast({
          title: "Statement processed successfully",
          description: `Found ${parsedTransactions.length} transaction${parsedTransactions.length !== 1 ? 's' : ''}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Processing error",
        description: "There was an error parsing your statement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Salary: "bg-gradient-success text-success-foreground",
      Rent: "bg-destructive/10 text-destructive",
      Groceries: "bg-accent/20 text-accent-foreground",
      Transport: "bg-primary/10 text-primary",
      Utilities: "bg-warning/10 text-warning",
      Dining: "bg-secondary text-secondary-foreground",
      Subscriptions: "bg-muted text-muted-foreground",
      Miscellaneous: "bg-muted text-muted-foreground",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netAmount = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Financial Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform your bank statements into organized financial insights
          </p>
        </div>

        {/* Input Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Bank Statement Parser
            </CardTitle>
            <CardDescription>
              Choose your preferred input method: paste text or upload a PDF file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Text Input</TabsTrigger>
                <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="space-y-4 mt-4">
                <Textarea
                  placeholder={`Example format:

Date: 06/01/2024
Description: Uber Trip
Amount: -25.00

Date: 06/02/2024
Description: Netflix Subscription
Amount: -12.99

Date: 06/05/2024
Description: Salary June
Amount: 3000.00`}
                  value={statementText}
                  onChange={(e) => setStatementText(e.target.value)}
                  className="min-h-[200px] font-mono"
                />
                <Button 
                  onClick={handleParseStatement}
                  disabled={isProcessing}
                  className="w-full bg-gradient-primary hover:shadow-elegant transition-all duration-300"
                >
                  {isProcessing ? "Processing..." : "Parse Statement"}
                </Button>
              </TabsContent>
              
              <TabsContent value="pdf" className="space-y-4 mt-4">
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <div className="text-4xl">📄</div>
                      <div className="text-lg font-medium">
                        {selectedFile ? selectedFile.name : "Click to select PDF file"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Upload your bank statement PDF file
                      </div>
                    </div>
                  </label>
                </div>
                <Button 
                  onClick={handleParsePDF}
                  disabled={isProcessing || !selectedFile}
                  className="w-full bg-gradient-primary hover:shadow-elegant transition-all duration-300"
                >
                  {isProcessing ? "Processing PDF..." : "Parse PDF"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-success flex items-center justify-center">
                    <span className="text-success-foreground text-sm font-bold">↑</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-success">${totalIncome.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <span className="text-destructive text-sm font-bold">↓</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-destructive">${totalExpenses.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    netAmount >= 0 ? 'bg-gradient-success' : 'bg-destructive/10'
                  }`}>
                    <span className={`text-sm font-bold ${
                      netAmount >= 0 ? 'text-success-foreground' : 'text-destructive'
                    }`}>
                      =
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Amount</p>
                    <p className={`text-2xl font-bold ${
                      netAmount >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      ${netAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CSV Download */}
        {csvData && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📄 CSV Export
              </CardTitle>
              <CardDescription>
                Download your transactions as a CSV file for further analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadCsv} variant="outline" className="w-full">
                Download CSV File
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results Table */}
        {transactions.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Parsed Transactions
                <Badge variant="outline" className="ml-auto">
                  {transactions.length} transactions
                </Badge>
              </CardTitle>
              <CardDescription>
                Your transactions have been automatically categorized from CSV data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className={`text-right font-bold ${
                          transaction.amount >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          ${transaction.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(transaction.category)}>
                            {transaction.category}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};