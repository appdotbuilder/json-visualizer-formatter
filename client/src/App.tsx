
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { JsonTreeView } from '@/components/JsonTreeView';
import { FileUploader } from '@/components/FileUploader';
import type { JsonProcessInput, JsonProcessResult, JsonValidationResult } from '../../server/src/schema';

function App() {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [processedResult, setProcessedResult] = useState<JsonProcessResult | null>(null);
  const [validationResult, setValidationResult] = useState<JsonValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [operation, setOperation] = useState<JsonProcessInput['operation']>('format');
  const [indentSize, setIndentSize] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<string>('input');

  // Auto-validate JSON when input changes
  const validateJsonContent = useCallback(async (content: string) => {
    if (!content.trim()) {
      setValidationResult(null);
      return;
    }

    try {
      const result = await trpc.validateJson.query(content);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        error: 'Failed to validate JSON',
        lineNumber: null,
        columnNumber: null
      });
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateJsonContent(jsonInput);
    }, 500); // Debounce validation

    return () => clearTimeout(timeoutId);
  }, [jsonInput, validateJsonContent]);

  const handleProcessJson = async () => {
    if (!jsonInput.trim()) return;

    setIsProcessing(true);
    try {
      const input: JsonProcessInput = {
        jsonContent: jsonInput,
        operation,
        indentSize,
        sortKeys: operation === 'sort-keys'
      };

      const result = await trpc.processJson.mutate(input);
      setProcessedResult(result);
      
      if (result.success && result.result) {
        setActiveTab('result');
      }
    } catch (error) {
      console.error('Processing error:', error);
      setProcessedResult({
        success: false,
        result: null,
        error: 'Failed to process JSON',
        originalSize: jsonInput.length,
        processedSize: null,
        operation
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUploaded = (content: string, result: JsonProcessResult) => {
    setJsonInput(content);
    setProcessedResult(result);
    if (result.success) {
      setActiveTab('result');
    }
  };

  const handleCopyResult = () => {
    if (processedResult?.result) {
      navigator.clipboard.writeText(processedResult.result);
    }
  };

  const handleLoadSample = () => {
    const sampleJson = {
      "name": "JSON Formatter",
      "version": "1.0.0",
      "description": "A beautiful JSON visualization tool",
      "features": [
        "Tree view visualization",
        "Syntax validation",
        "Multiple formatting options",
        "File upload support"
      ],
      "metadata": {
        "created": "2024-01-01",
        "author": "Developer",
        "tags": ["json", "formatter", "visualizer"]
      },
      "settings": {
        "theme": "light",
        "autoValidate": true,
        "defaultIndent": 2
      }
    };
    setJsonInput(JSON.stringify(sampleJson, null, 2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌳 JSON Tree Visualizer
          </h1>
          <p className="text-lg text-gray-600">
            Format, validate, and explore your JSON data with an interactive tree view
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📝 JSON Input
                {validationResult && (
                  <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                    {validationResult.isValid ? "Valid" : "Invalid"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Paste your JSON content or upload a file to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">Text Input</TabsTrigger>
                  <TabsTrigger value="file">File Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="json-input">JSON Content</Label>
                    <Button variant="outline" size="sm" onClick={handleLoadSample}>
                      📄 Load Sample
                    </Button>
                  </div>
                  <Textarea
                    id="json-input"
                    placeholder="Paste your JSON here..."
                    value={jsonInput}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonInput(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                </TabsContent>
                
                <TabsContent value="file">
                  <FileUploader onFileUploaded={handleFileUploaded} />
                </TabsContent>
              </Tabs>

              {validationResult && !validationResult.isValid && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>JSON Error:</strong> {validationResult.error}
                    {validationResult.lineNumber && validationResult.columnNumber && (
                      <span className="block mt-1 text-sm">
                        Line {validationResult.lineNumber}, Column {validationResult.columnNumber}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Processing Options */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">🔧 Processing Options</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="operation">Operation</Label>
                    <Select value={operation} onValueChange={(value: JsonProcessInput['operation']) => setOperation(value)}>
                      <SelectTrigger id="operation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="validate">🔍 Validate Only</SelectItem>
                        <SelectItem value="format">✨ Pretty Format</SelectItem>
                        <SelectItem value="minify">📦 Minify</SelectItem>
                        <SelectItem value="sort-keys">🔤 Sort Keys</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(operation === 'format' || operation === 'sort-keys') && (
                    <div className="space-y-2">
                      <Label htmlFor="indent">Indent Size</Label>
                      <Select value={indentSize.toString()} onValueChange={(value) => setIndentSize(parseInt(value))}>
                        <SelectTrigger id="indent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 space</SelectItem>
                          <SelectItem value="2">2 spaces</SelectItem>
                          <SelectItem value="4">4 spaces</SelectItem>
                          <SelectItem value="8">8 spaces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleProcessJson} 
                  disabled={isProcessing || !jsonInput.trim() || (validationResult !== null && !validationResult.isValid)}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? "Processing..." : `🚀 ${operation.charAt(0).toUpperCase() + operation.slice(1)} JSON`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  🎯 Results
                  {processedResult && (
                    <Badge variant={processedResult.success ? "default" : "destructive"}>
                      {processedResult.success ? "Success" : "Error"}
                    </Badge>
                  )}
                </span>
                {processedResult?.success && processedResult.result && (
                  <Button variant="outline" size="sm" onClick={handleCopyResult}>
                    📋 Copy
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Processed JSON output and interactive visualization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processedResult ? (
                <div className="space-y-4">
                  {/* Processing Stats */}
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Original: {processedResult.originalSize} chars</span>
                    {processedResult.processedSize && (
                      <span>Processed: {processedResult.processedSize} chars</span>
                    )}
                    {processedResult.originalSize > 0 && processedResult.processedSize && (
                      <span className="font-medium">
                        {processedResult.processedSize > processedResult.originalSize ? '+' : ''}
                        {Math.round(((processedResult.processedSize - processedResult.originalSize) / processedResult.originalSize) * 100)}%
                      </span>
                    )}
                  </div>

                  {processedResult.success && processedResult.result ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="tree">🌳 Tree View</TabsTrigger>
                        <TabsTrigger value="result">📄 Raw Output</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="tree" className="mt-4">
                        <div className="border rounded-lg p-4 bg-gray-50 max-h-[500px] overflow-auto">
                          <JsonTreeView jsonString={processedResult.result} />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="result" className="mt-4">
                        <Textarea
                          value={processedResult.result}
                          readOnly
                          className="min-h-[400px] font-mono text-sm bg-gray-50"
                        />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <strong>Processing Error:</strong> {processedResult.error ?? 'Unknown error occurred'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🌳</div>
                  <p className="text-lg">Process your JSON to see the results here</p>
                  <p className="text-sm mt-2">Tree visualization and formatted output will appear after processing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
