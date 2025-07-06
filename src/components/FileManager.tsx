import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Trash2, Calendar, FileSpreadsheet, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'csv';
  size: number;
  uploadDate: Date;
  csvData?: string;
  transactionCount?: number;
}

interface FileManagerProps {
  onFileSelect: (csvData: string, fileName: string) => void;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: (files: UploadedFile[]) => void;
}

export const FileManager = ({ onFileSelect, uploadedFiles, setUploadedFiles }: FileManagerProps) => {
  const { toast } = useToast();

  const deleteFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
    setUploadedFiles(updatedFiles);
    localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
    toast({
      title: "File deleted",
      description: "The file has been removed from your uploads.",
    });
  };

  const downloadFile = (file: UploadedFile) => {
    if (file.csvData) {
      const blob = new Blob([file.csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const viewFile = (file: UploadedFile) => {
    if (file.csvData) {
      onFileSelect(file.csvData, file.name);
      toast({
        title: "File loaded",
        description: `${file.name} has been loaded for analysis.`,
      });
    }
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    localStorage.removeItem('uploadedFiles');
    toast({
      title: "All files cleared",
      description: "All uploaded files have been removed.",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: 'pdf' | 'csv') => {
    return type === 'pdf' ? (
      <FileText className="h-4 w-4 text-red-500" />
    ) : (
      <FileSpreadsheet className="h-4 w-4 text-green-500" />
    );
  };

  const getFileTypeBadge = (type: 'pdf' | 'csv') => {
    return (
      <Badge variant={type === 'pdf' ? 'destructive' : 'default'} className="text-xs">
        {type.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          File Manager
          {uploadedFiles.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {uploadedFiles.length} files
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          View and manage all your uploaded files. Download, delete, or load files for analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploadedFiles.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No files uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload PDF or CSV files to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFiles}
              >
                Clear All
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type)}
                          <span className="font-medium truncate max-w-[200px]" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getFileTypeBadge(file.type)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(file.uploadDate, { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {file.transactionCount ? (
                          <Badge variant="secondary" className="text-xs">
                            {file.transactionCount} transactions
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {file.csvData && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewFile(file)}
                                title="Load for analysis"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadFile(file)}
                                title="Download CSV"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFile(file.id)}
                            title="Delete file"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};