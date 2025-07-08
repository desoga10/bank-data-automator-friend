import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { DataAnalyzer } from "@/components/DataAnalyzer";
import { FileManager } from "@/components/FileManager";
import { FinancialAssistant } from "@/components/FinancialAssistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Upload, FileText, Brain, BarChart3 } from "lucide-react";
import { Transaction } from "@/utils/csvProcessor";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [csvData, setCsvData] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleDataProcessed = (data: Transaction[], csv: string, name: string) => {
    setTransactions(data);
    setCsvData(csv);
    setFileName(name);
    setShowAnalysis(true);
    
    // Add to uploaded files if not already present
    const fileExists = uploadedFiles.find(f => f.name === name);
    if (!fileExists) {
      const newFile = {
        id: Date.now().toString(),
        name,
        csvData: csv,
        transactionCount: data.length,
        uploadedAt: new Date()
      };
      setUploadedFiles(prev => [...prev, newFile]);
    }
  };

  const handleFileProcessed = (csvData: string, fileName: string) => {
    // Parse the CSV to get transaction data
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      const transactions = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        return {
          date: values[0] || '',
          description: values[1] || '',
          amount: parseFloat(values[2]) || 0,
          category: values[3] || 'Miscellaneous'
        };
      });
      
      handleDataProcessed(transactions, csvData, fileName);
    }
  };

  const handleUploadAnother = () => {
    setShowAnalysis(false);
  };

  const handleDocumentSelect = (csvData: string, fileName: string) => {
    // Find the file and process its data
    const selectedFile = uploadedFiles.find(f => f.name === fileName);
    if (selectedFile) {
      // Re-process the CSV data to get transactions
      const lines = csvData.split('\n').filter(line => line.trim());
      if (lines.length > 1) {
        const transactions = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return {
            date: values[0] || '',
            description: values[1] || '',
            amount: parseFloat(values[2]) || 0,
            category: values[3] || 'Miscellaneous'
          };
        });
        
        setTransactions(transactions);
        setCsvData(csvData);
        setFileName(fileName);
        setShowAnalysis(true);
      }
    }
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
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      File Manager
                    </CardTitle>
                    <CardDescription>
                      Manage your uploaded financial documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileManager 
                      uploadedFiles={uploadedFiles}
                      setUploadedFiles={setUploadedFiles}
                      onFileSelect={handleDocumentSelect}
                    />
                  </CardContent>
                </Card>
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
                            {uploadedFiles[uploadedFiles.length - 1]?.name || 'No files'}
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