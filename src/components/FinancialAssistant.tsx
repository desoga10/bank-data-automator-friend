import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/FileUpload";
import { FileManager } from "@/components/FileManager";
import { DataAnalyzer } from "@/components/DataAnalyzer";
import { parseStatementText, convertToCsv, parseCsv, Transaction } from "@/utils/csvProcessor";

export const FinancialAssistant = () => {
  const [statementText, setStatementText] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [csvData, setCsvData] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const { toast } = useToast();

  // Load uploaded files from localStorage on component mount
  useEffect(() => {
    const loadUploadedFiles = () => {
      const savedFiles = localStorage.getItem('uploadedFiles');
      if (savedFiles) {
        try {
          const files = JSON.parse(savedFiles).map((file: any) => ({
            ...file,
            uploadDate: new Date(file.uploadDate)
          }));
          setUploadedFiles(files);
        } catch (error) {
          console.error('Error loading saved files:', error);
          setUploadedFiles([]);
        }
      }
    };

    loadUploadedFiles();
  }, []);

  // Save uploaded files to localStorage whenever the list changes
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
    }
  }, [uploadedFiles]);

  const addToFileManager = (csvData: string, fileName: string, type: 'csv', transactionCount?: number) => {
    const fileData = {
      id: Date.now().toString(),
      name: fileName,
      type,
      size: new Blob([csvData]).size,
      uploadDate: new Date(),
      csvData,
      transactionCount
    };

    // Update the local state
    setUploadedFiles(prev => {
      const newFiles = [fileData, ...prev];
      // Also save to localStorage immediately
      localStorage.setItem('uploadedFiles', JSON.stringify(newFiles));
      return newFiles;
    });
  };

  const handleFileProcessed = (processedCsvData: string, processedFileName: string) => {
    setCsvData(processedCsvData);
    setFileName(processedFileName);
    
    // Parse the CSV data to get transactions for analysis
    const parsedTransactions = parseCsv(processedCsvData);
    setTransactions(parsedTransactions);
    
    // Add to file manager
    addToFileManager(processedCsvData, processedFileName, 'csv', parsedTransactions.length);
    
    toast({
      title: "File processed successfully",
      description: `Found ${parsedTransactions.length} transactions in ${processedFileName}`,
    });
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
        
        // Convert to CSV for consistency
        const csvContent = convertToCsv(parsedTransactions);
        setCsvData(csvContent);
        setFileName("manual_input.txt");
        
        // Add to file manager
        addToFileManager(csvContent, "manual_input.csv", 'csv', parsedTransactions.length);
        
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

  const handleUploadAnother = () => {
    // Only clear the current analysis data, NOT the uploaded files
    setTransactions([]);
    setCsvData("");
    setFileName("");
    setStatementText("");
    
    // Don't clear uploadedFiles state - this preserves the file history
    toast({
      title: "Ready for new upload",
      description: "You can now upload another document. Your previous files are still available in the File Manager.",
    });
  };

  const handleDocumentSelect = (selectedCsvData: string, selectedFileName: string) => {
    // Load the selected document for analysis
    handleFileProcessed(selectedCsvData, selectedFileName);
  };

  const handleFileManagerSelect = (selectedCsvData: string, selectedFileName: string) => {
    // When selecting from file manager, just load the data for analysis
    setCsvData(selectedCsvData);
    setFileName(selectedFileName);
    
    // Parse the CSV data to get transactions for analysis
    const parsedTransactions = parseCsv(selectedCsvData);
    setTransactions(parsedTransactions);
    
    toast({
      title: "File loaded for analysis",
      description: `Analyzing ${parsedTransactions.length} transactions from ${selectedFileName}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Financial Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform your bank statements into organized financial insights
          </p>
        </div>

        {transactions.length === 0 ? (
          /* Input Section */
          <div className="space-y-6">
            <Tabs defaultValue="csv" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                <TabsTrigger value="text">Text Input</TabsTrigger>
                <TabsTrigger value="files">
                  File Manager
                  {uploadedFiles.length > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                      {uploadedFiles.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="csv" className="mt-6">
                <div className="space-y-6">
                  <FileUpload
                    onFileProcessed={handleFileProcessed}
                    onProcessingStart={() => setIsProcessing(true)}
                    onProcessingEnd={() => setIsProcessing(false)}
                  />
                  
                  {/* Conversion Guide */}
                  <Card className="shadow-card border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        📋 Don't have a CSV file? Here's how to convert your bank statement:
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">🏦 From Your Bank</h4>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• Log into your online banking</li>
                            <li>• Go to account statements</li>
                            <li>• Look for "Export" or "Download" options</li>
                            <li>• Choose CSV or Excel format</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">🔄 Online Converters</h4>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• ILovePDF.com (PDF to CSV)</li>
                            <li>• SmallPDF.com</li>
                            <li>• PDF24.org</li>
                            <li>• Google Sheets (import PDF)</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          <strong>💡 Tip:</strong> Your CSV should have columns for Date, Description, and Amount. 
                          Our system automatically detects different formats!
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              
              <TabsContent value="text" className="mt-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📊 Manual Text Input
                    </CardTitle>
                    <CardDescription>
                      Paste your bank statement data in any of the supported formats shown below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder={`Supported formats (paste any of these):

FORMAT 1 - US/UK Bank Statement:
Date        Description              Debit    Credit   Balance
06/01/2024  Uber Trip               25.00             975.00
06/02/2024  Netflix Subscription    12.99             962.01
06/05/2024  Salary June                      3000.00  3962.01

FORMAT 2 - PayPal CSV Statement:
Date,Name,Type,Status,Amount,Currency
06/01/2024,Uber BV,Payment,Completed,-25.00,USD
06/02/2024,Netflix Inc,Payment,Completed,-12.99,USD
06/05/2024,Employer Co,Deposit,Completed,3000.00,USD

FORMAT 3 - Standard Bank Format:
Trans Date  Value Date  Description         Debit    Credit   Running Balance
06/01/2024  06/01/2024  POS PURCHASE       25.00             975.00
06/02/2024  06/02/2024  ONLINE PAYMENT     12.99             962.01
06/05/2024  06/05/2024  SALARY CREDIT               3000.00  3962.01

FORMAT 4 - International Bank PDF:
Date: 06/01/2024
Description: Uber Trip
Amount: -25.00
Balance: 975.00

Date: 06/02/2024
Description: Netflix Subscription
Amount: -12.99
Balance: 962.01

DATE: 06/05/2024
DESCRIPTION: Salary June
AMOUNT: +3000.00
BALANCE: 3962.01

FORMAT 5 - Minimalist CSV Format:
Date,Description,Amount
06/01/2024,Uber Trip,-25.00
06/02/2024,Netflix Subscription,-12.99
06/05/2024,Salary June,3000.00

FORMAT 6 - Simple Transaction List:
06/01/2024 | Uber Trip | -$25.00
06/02/2024 | Netflix Subscription | -$12.99
06/05/2024 | Salary June | +$3000.00

Note: The system automatically detects your format. Use +/- signs or Debit/Credit columns to indicate transaction direction.`}
                      value={statementText}
                      onChange={(e) => setStatementText(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <Button 
                      onClick={handleParseStatement}
                      disabled={isProcessing}
                      className="w-full bg-gradient-primary hover:shadow-elegant transition-all duration-300"
                    >
                      {isProcessing ? "Processing..." : "Parse Statement"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="mt-6">
                <FileManager 
                  onFileSelect={handleFileManagerSelect}
                  uploadedFiles={uploadedFiles}
                  setUploadedFiles={setUploadedFiles}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* Analysis Section */
          <div className="space-y-6">
            <DataAnalyzer 
              transactions={transactions}
              csvData={csvData}
              fileName={fileName}
              onUploadAnother={handleUploadAnother}
              onDocumentSelect={handleDocumentSelect}
              uploadedFiles={uploadedFiles}
            />
          </div>
        )}
      </div>
    </div>
  );
};