import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileProcessed: (csvData: string, fileName: string) => void;
  onProcessingStart: () => void;
  onProcessingEnd: () => void;
}

export const FileUpload = ({ onFileProcessed, onProcessingStart, onProcessingEnd }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvStructure, setCsvStructure] = useState<any>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const analyzeFile = async (file: File) => {
    try {
      const csvText = await file.text();
      const { analyzeCsvStructure } = await import('@/utils/csvProcessor');
      const structure = analyzeCsvStructure(csvText);
      setCsvStructure(structure);
      
      if (structure && structure.detectedStructure.isValid) {
        toast({
          title: "CSV structure detected",
          description: `Found ${structure.headers.length} columns. Ready for processing.`,
        });
      } else {
        toast({
          title: "CSV structure analysis",
          description: "Could not detect standard bank format. Will attempt to process anyway.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error analyzing CSV:', error);
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!validateFile(file)) return;
    
    setSelectedFile(file);
    await analyzeFile(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    onProcessingStart();
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Read the CSV file
      const csvText = await selectedFile.text();
      
      // Validate CSV format
      if (!csvText.trim()) {
        throw new Error("The CSV file appears to be empty.");
      }

      // Import CSV processing utilities
      const { parseCsv, validateCsvFormat } = await import('@/utils/csvProcessor');
      
      // Validate CSV format
      if (!validateCsvFormat(csvText)) {
        throw new Error("CSV format not recognized. Please ensure your file has Date, Description, and Amount (or Debit/Credit) columns with recognizable headers.");
      }
      
      // Parse transactions from CSV
      const transactions = parseCsv(csvText);
      
      if (transactions.length === 0) {
        throw new Error("No valid transactions found in the CSV file. Please check the file format and data.");
      }
      
      // Complete progress
      setUploadProgress(100);
      
      // Call the callback with processed data
      onFileProcessed(csvText, selectedFile.name);
      
      toast({
        title: "File processed successfully",
        description: `Loaded ${transactions.length} transactions from ${selectedFile.name}`,
      });

      // Reset state
      setSelectedFile(null);
      setCsvStructure(null);
      
    } catch (error) {
      console.error('CSV processing error:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process the CSV file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      onProcessingEnd();
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const downloadSampleCsv = () => {
    const sampleCsv = `Date,Description,Amount,Category
2024-01-15,Salary Deposit,3000.00,Salary
2024-01-16,Grocery Store,-85.50,Groceries
2024-01-17,Gas Station,-45.00,Transport
2024-01-18,Netflix Subscription,-12.99,Subscriptions
2024-01-19,Restaurant Dinner,-67.25,Dining`;

    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadBankSampleCsv = () => {
    const bankSampleCsv = `Trans. Date,Value Date,NARRATION,Debit,Credit
2024-01-15,2024-01-15,SALARY CREDIT - COMPANY XYZ,,3000.00
2024-01-16,2024-01-16,POS PURCHASE - GROCERY MART,85.50,
2024-01-17,2024-01-17,ATM WITHDRAWAL - MAIN STREET,45.00,
2024-01-18,2024-01-18,ONLINE PAYMENT - NETFLIX,12.99,
2024-01-19,2024-01-19,CARD PAYMENT - RESTAURANT ABC,67.25,`;

    const blob = new Blob([bankSampleCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bank_statement_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          CSV File Upload
        </CardTitle>
        <CardDescription>
          Upload your bank statement CSV to automatically analyze transactions. Supports various bank formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and Drop Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
            isDragOver 
              ? "border-primary bg-primary/5 scale-105" 
              : "border-muted hover:border-primary/50 hover:bg-muted/50",
            selectedFile && "border-success bg-success/5"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
            id="csv-upload"
            disabled={isProcessing}
          />
          
          <label htmlFor="csv-upload" className="cursor-pointer block">
            <div className="space-y-3">
              {selectedFile ? (
                <>
                  <FileText className="h-12 w-12 mx-auto text-success" />
                  <div>
                    <div className="text-lg font-medium text-success">
                      {selectedFile.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <div className="text-lg font-medium">
                      Drop your CSV here or click to browse
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Supports CSV files up to 10MB
                    </div>
                  </div>
                </>
              )}
            </div>
          </label>
        </div>

        {/* CSV Structure Analysis */}
        {csvStructure && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-medium mb-1">Detected CSV Structure:</p>
                <p className="text-muted-foreground mb-2">
                  Headers: {csvStructure.headers.join(', ')}
                </p>
                {csvStructure.detectedStructure.isValid ? (
                  <div className="text-green-600">
                    ✓ Compatible format detected
                    {csvStructure.detectedStructure.hasSeparateColumns && (
                      <span className="block">• Found separate Debit/Credit columns</span>
                    )}
                    {csvStructure.detectedStructure.hasSingleAmount && (
                      <span className="block">• Found single Amount column</span>
                    )}
                  </div>
                ) : (
                  <div className="text-amber-600">
                    ⚠ Non-standard format - will attempt to process
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing CSV...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={processFile}
            disabled={!selectedFile || isProcessing}
            className="flex-1 bg-gradient-primary hover:shadow-elegant transition-all duration-300"
          >
            {isProcessing ? "Processing..." : "Process CSV"}
          </Button>
          
          {selectedFile && !isProcessing && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedFile(null);
                setCsvStructure(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Sample CSV Downloads */}
        <div className="flex justify-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={downloadSampleCsv}
            className="text-muted-foreground hover:text-foreground"
          >
            <Download className="h-4 w-4 mr-2" />
            Standard Sample
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={downloadBankSampleCsv}
            className="text-muted-foreground hover:text-foreground"
          >
            <Download className="h-4 w-4 mr-2" />
            Bank Format Sample
          </Button>
        </div>

        {/* Help Text */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Supported Bank Formats:</p>
            <ul className="space-y-1">
              <li>• <strong>Date columns:</strong> Date, Trans Date, Value Date, Transaction Date</li>
              <li>• <strong>Description columns:</strong> Description, Remarks, Narration, Details</li>
              <li>• <strong>Amount formats:</strong> Single Amount column OR separate Debit/Credit columns</li>
              <li>• <strong>Optional:</strong> Category, Type, Classification columns</li>
            </ul>
            <p className="mt-2 text-amber-600">
              💡 The system automatically detects your bank's CSV format and processes accordingly.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};