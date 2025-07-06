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
    // For now, we'll use a simplified approach
    // In a real implementation, you'd use a PDF parsing library like pdf-parse or PDF.js
    const arrayBuffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer);
    
    // Extract readable text patterns (very basic approach)
    const lines = text.split('\n').filter(line => 
      line.trim().length > 0 && 
      /[a-zA-Z]/.test(line) && 
      !line.includes('�')
    );
    
    return lines.join('\n');
  };

  const convertPdfTextToCsv = (text: string): string => {
    const lines = text.split('\n').filter(line => line.trim());
    const csvLines = ['Date,Description,Amount,Type'];
    
    // Simple pattern matching for common transaction formats
    lines.forEach(line => {
      // Look for date patterns and amounts
      const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      const amountMatch = line.match(/[\-\+]?\$?(\d+[\.,]\d{2})/);
      
      if (dateMatch && amountMatch) {
        const date = dateMatch[1];
        const amount = amountMatch[1].replace(',', '');
        const description = line.replace(dateMatch[0], '').replace(amountMatch[0], '').trim();
        const type = amount.startsWith('-') ? 'Debit' : 'Credit';
        
        csvLines.push(`${date},"${description}",${amount},${type}`);
      }
    });
    
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