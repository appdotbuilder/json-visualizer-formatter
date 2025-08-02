
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import type { JsonProcessResult, FileUploadInput } from '../../../server/src/schema';

interface FileUploaderProps {
  onFileUploaded: (content: string, result: JsonProcessResult) => void;
}

export function FileUploader({ onFileUploaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev: number) => Math.min(prev + 10, 90));
      }, 100);

      const fileContent = await file.text();
      
      const input: FileUploadInput = {
        fileName: file.name,
        fileContent,
        fileSize: file.size
      };

      const result = await trpc.processFileUpload.mutate(input);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.result) {
        onFileUploaded(fileContent, result);
      } else {
        setError(result.error || 'Failed to process file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setError('Please select a JSON file (.json)');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Card 
        className={`border-2 border-dashed transition-all cursor-pointer ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-4xl">
              {isUploading ? '⏳' : '📁'}
            </div>
            
            {isUploading ? (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Uploading and processing...
                </p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                <p className="text-sm text-gray-500">
                  {uploadProgress}% complete
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Drop your JSON file here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-400">
                  Supports .json files up to 10MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={handleButtonClick}
          disabled={isUploading}
          className="w-full max-w-sm"
        >
          {isUploading ? 'Processing...' : '📂 Choose File'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Upload Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
