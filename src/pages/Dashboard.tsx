import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { DataAnalyzer } from "@/components/DataAnalyzer";
import { FileManager } from "@/components/FileManager";
import { FinancialAssistant } from "@/components/FinancialAssistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Upload, FileText, Brain, BarChart3 } from "lucide-react";
import { Transaction, parseCsv } from "@/utils/csvProcessor";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [csvData, setCsvData] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

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

  const addToFileManager = (csvData: string, fileName: string, type: 'pdf' | 'csv', transactionCount?: number) => {
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

  const handleFileProcessed = (csvData: string, fileName: string) => {
    try {
      // Parse the CSV to get transaction data
      const parsedTransactions = parseCsv(csvData);
      
      if (parsedTransactions.length === 0) {
        throw new Error("No valid transactions found in the CSV file.");
      }

      // Set the analysis data
      setTransactions(parsedTransactions);
      setCsvData(csvData);
      setFileName(fileName);
      setShowAnalysis(true);
      
      // Add to file manager
      addToFileManager(csvData, fileName, 'csv', parsedTransactions.length);
      
      console.log(`Processed ${parsedTransactions.length} transactions from ${fileName}`);
    } catch (error) {
      console.error('Error processing file:', error);
      // You might want to show an error toast here
    }
  };

  const handleUploadAnother = () => {
    // Only clear the current analysis data, NOT the uploaded files
    setTransactions([]);
    setCsvData("");
    setFileName("");
    setShowAnalysis(false);
    
    // Don't clear uploadedFiles state - this preserves the file history
    console.log(`File history preserved: ${uploadedFiles.length} files available`);
  };

  const handleDocumentSelect = (selectedCsvData: string, selectedFileName: string) => {
    try {
      // Parse the selected CSV data to get transactions
      const parsedTransactions = parseCsv(selectedCsvData);
      
      if (parsedTransactions.length === 0) {
        throw new Error("No valid transactions found in the selected file.");
      }

      // Set the analysis data
      setTransactions(parsedTransactions);
      setCsvData(selectedCsvData);
      setFileName(selectedFileName);
      setShowAnalysis(true);
      
      console.log(`Loaded ${parsedTransactions.length} transactions from ${selectedFileName}`);
    } catch (error) {
      console.error('Error loading selected file:', error);
      // You might want to show an error toast here
    }
  };

  const handleFileManagerSelect = (selectedCsvData: string, selectedFileName: string) => {
    handleDocumentSelect(selectedCsvData, selectedFileName);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">FinanceFlow</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link to="/pricing" className="text-foreground hover:text-primary font-medium">
              Pricing
            </Link>
            <Link to="/signin">
              <Button variant="ghost" size="sm">Logout</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!showAnalysis ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Financial Analysis Dashboard
              </h1>
              <p className="text-xl text-muted-foreground">
                Upload your bank statements to get started with intelligent financial insights
              </p>
            </div>

            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Files
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  My Files
                  {uploadedFiles.length > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                      {uploadedFiles.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="assistant" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Assistant
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Bank Statements
                    </CardTitle>
                    <CardDescription>
                      Upload CSV files from your bank to analyze your financial data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload 
                      onFileProcessed={handleFileProcessed}
                      onProcessingStart={() => {}}
                      onProcessingEnd={() => {}}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="space-y-6">
                <FileManager 
                  uploadedFiles={uploadedFiles}
                  setUploadedFiles={setUploadedFiles}
                  onFileSelect={handleFileManagerSelect}
                />
              </TabsContent>

              <TabsContent value="assistant" className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Financial AI Assistant
                    </CardTitle>
                    <CardDescription>
                      Get personalized financial advice and insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FinancialAssistant />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Stats */}
            {uploadedFiles.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Quick Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="shadow-card">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="text-primary text-sm" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Files</p>
                          <p className="text-2xl font-bold text-primary">{uploadedFiles.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-card">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                          <BarChart3 className="text-success text-sm" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Transactions</p>
                          <p className="text-2xl font-bold text-success">
                            {uploadedFiles.reduce((sum, file) => sum + (file.transactionCount || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                          <TrendingUp className="text-warning text-sm" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Latest Upload</p>
                          <p className="text-sm font-medium text-warning truncate">
                            {uploadedFiles[0]?.name || 'No files'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        ) : (
          <DataAnalyzer
            transactions={transactions}
            csvData={csvData}
            fileName={fileName}
            onUploadAnother={handleUploadAnother}
            onDocumentSelect={handleDocumentSelect}
            uploadedFiles={uploadedFiles}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;