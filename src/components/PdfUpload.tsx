import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface PdfUploadProps {
  onPdfConverted: (csvData: string, fileName: string) => void;
  onProcessingStart: () => void;
  onProcessingEnd: () => void;
}

export const PdfUpload = ({ onPdfConverted, onProcessingStart, onProcessingEnd }: PdfUploadProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    onProcessingStart();

    try {
      // Read PDF file as text (simplified approach)
      const text = await extractTextFromPdf(file);
      
      if (!text.trim()) {
        throw new Error("No readable text found in PDF");
      }

      // Convert extracted text to CSV format
      const csvData = convertPdfTextToCsv(text);
      const csvFileName = file.name.replace('.pdf', '.csv');

      onPdfConverted(csvData, csvFileName);
      
      toast({
        title: "PDF converted successfully",
        description: `${file.name} has been converted to CSV format.`,
      });
    } catch (error) {
      console.error('PDF processing error:', error);
      toast({
        title: "PDF processing failed",
        description: "Unable to extract readable data from this PDF. Try uploading a text-based PDF or use the manual input option.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      onProcessingEnd();
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      // Import pdf-parse dynamically since it's a Node.js library
      const pdfParse = await import('pdf-parse');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      const pdfData = await pdfParse.default(buffer);
      return pdfData.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      // Fallback to basic text extraction for browser compatibility
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);
      
      // Extract readable text patterns (basic approach)
      const lines = text.split('\n').filter(line => 
        line.trim().length > 0 && 
        /[a-zA-Z0-9]/.test(line) && 
        !line.includes('�') &&
        line.length > 5
      );
      
      return lines.join('\n');
    }
  };

  const convertPdfTextToCsv = (text: string): string => {
    console.log('🔍 Raw PDF text:', text.substring(0, 500) + '...');
    
    const lines = text.split('\n').filter(line => line.trim());
    const csvLines = ['Date,Description,Amount,Balance'];
    const transactions: any[] = [];
    
    // Remove common headers and noise
    const cleanLines = lines.filter(line => {
      const cleanLine = line.trim().toLowerCase();
      return !cleanLine.includes('transaction reference') &&
             !cleanLine.includes('value date') &&
             !cleanLine.includes('description') &&
             !cleanLine.includes('balance') &&
             !cleanLine.includes('amount') &&
             !cleanLine.includes('debit') &&
             !cleanLine.includes('credit') &&
             cleanLine.length > 3;
    });
    
    console.log('🧹 Cleaned lines:', cleanLines.slice(0, 10));
    
    let i = 0;
    while (i < cleanLines.length) {
      const line = cleanLines[i].trim();
      
      // Look for date patterns (various formats)
      const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,  // DD/MM/YYYY or DD-MM-YYYY
        /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,    // YYYY/MM/DD or YYYY-MM-DD
        /(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i, // DD MMM YYYY
      ];
      
      let dateMatch = null;
      for (const pattern of datePatterns) {
        dateMatch = line.match(pattern);
        if (dateMatch) break;
      }
      
      if (dateMatch) {
        let date = dateMatch[1];
        let description = '';
        let amount = 0;
        let balance = '';
        
        // Convert date to YYYY-MM-DD format
        if (date.includes('/') || date.includes('-')) {
          const parts = date.split(/[\/\-]/);
          if (parts[0].length === 4) {
            // Already YYYY-MM-DD
            date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else {
            // DD/MM/YYYY or MM/DD/YYYY - assume DD/MM/YYYY
            date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        
        // Get description and amount from current and next lines
        let currentLine = line.replace(dateMatch[0], '').trim();
        let nextLineIndex = i + 1;
        
        // Look for amount in current line or next few lines
        const amountPatterns = [
          /[\+\-]?\s*[₦\$£€]?\s*([0-9,]+\.?\d{0,2})/g,
          /([0-9,]+\.?\d{0,2})\s*[₦\$£€]?[\+\-]?/g,
        ];
        
        let foundAmount = false;
        let searchText = currentLine;
        
        // Check current line and next 2 lines for amount
        for (let j = 0; j < 3 && (i + j) < cleanLines.length; j++) {
          if (j > 0) {
            searchText += ' ' + cleanLines[i + j].trim();
          }
          
          for (const pattern of amountPatterns) {
            const matches = [...searchText.matchAll(pattern)];
            for (const match of matches) {
              const potentialAmount = match[1] || match[0];
              const cleanAmount = potentialAmount.replace(/[₦\$£€,\s]/g, '');
              
              if (!isNaN(parseFloat(cleanAmount)) && parseFloat(cleanAmount) > 0) {
                amount = parseFloat(cleanAmount);
                
                // Determine if it's debit or credit
                const fullMatch = match[0];
                const beforeAmount = searchText.substring(0, searchText.indexOf(fullMatch));
                const afterAmount = searchText.substring(searchText.indexOf(fullMatch) + fullMatch.length);
                
                // Check for debit indicators
                if (fullMatch.includes('-') || 
                    beforeAmount.toLowerCase().includes('debit') ||
                    beforeAmount.toLowerCase().includes('withdrawal') ||
                    afterAmount.toLowerCase().includes('dr')) {
                  amount = -Math.abs(amount);
                }
                
                // Remove amount from description
                description = searchText.replace(match[0], '').trim();
                foundAmount = true;
                nextLineIndex = i + j + 1;
                break;
              }
            }
            if (foundAmount) break;
          }
          if (foundAmount) break;
        }
        
        // Clean up description
        description = description.replace(/\s+/g, ' ').trim();
        if (!description) {
          description = 'Transaction';
        }
        
        if (foundAmount && amount !== 0) {
          transactions.push({
            date,
            description,
            amount,
            balance
          });
          console.log(`✅ Parsed transaction: ${date} | ${description} | ${amount}`);
        }
        
        i = nextLineIndex;
      } else {
        i++;
      }
    }
    
    // Convert to CSV
    transactions.forEach(tx => {
      csvLines.push(`${tx.date},"${tx.description}",${tx.amount},${tx.balance}`);
    });
    
    console.log(`🎉 Extracted ${transactions.length} transactions from PDF`);
    return csvLines.join('\n');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Upload & Conversion
        </CardTitle>
        <CardDescription>
          Upload bank statement PDFs to automatically convert them to CSV format for analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {isProcessing ? (
            <div className="space-y-4">
              <div className="animate-spin mx-auto h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-sm text-muted-foreground">Converting PDF to CSV...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Drop your PDF file here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse files
                </p>
              </div>
              <Button onClick={openFileDialog} className="bg-gradient-primary hover:shadow-elegant transition-all duration-300">
                <Upload className="mr-2 h-4 w-4" />
                Choose PDF File
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">PDF Conversion Note</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                This feature works best with text-based PDFs. Scanned PDFs or image-based statements may not convert properly. 
                If conversion fails, try using the manual text input option instead.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};