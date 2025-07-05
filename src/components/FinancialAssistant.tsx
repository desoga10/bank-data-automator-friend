import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/FileUpload";
import { DataAnalyzer } from "@/components/DataAnalyzer";
import { parseStatementText, convertToCsv, parseCsv, Transaction } from "@/utils/csvProcessor";

export const FinancialAssistant = () => {
  const [statementText, setStatementText] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [csvData, setCsvData] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileProcessed = (processedCsvData: string, processedFileName: string) => {
    setCsvData(processedCsvData);
    setFileName(processedFileName);
    
    // Parse the CSV data to get transactions for analysis
    const parsedTransactions = parseCsv(processedCsvData);
    setTransactions(parsedTransactions);
    
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

  const clearData = () => {
    setTransactions([]);
    setCsvData("");
    setFileName("");
    setStatementText("");
    toast({
      title: "Data cleared",
      description: "All transaction data has been cleared.",
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
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">CSV Upload</TabsTrigger>
                <TabsTrigger value="text">Text Input</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-6">
                <FileUpload
                  onFileProcessed={handleFileProcessed}
                  onProcessingStart={() => setIsProcessing(true)}
                  onProcessingEnd={() => setIsProcessing(false)}
                />
              </TabsContent>
              
              <TabsContent value="text" className="mt-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📊 Manual Text Input
                    </CardTitle>
                    <CardDescription>
                      Paste your bank statement data in the format shown below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* Analysis Section */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Financial Analysis</h2>
                <p className="text-muted-foreground">
                  Analysis of {transactions.length} transactions from {fileName}
                </p>
              </div>
              <Button onClick={clearData} variant="outline">
                Clear Data
              </Button>
            </div>
            
            <DataAnalyzer 
              transactions={transactions}
              csvData={csvData}
              fileName={fileName}
            />
          </div>
        )}
      </div>
    </div>
  );
};