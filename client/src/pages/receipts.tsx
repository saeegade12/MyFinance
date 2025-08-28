import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload,
  Camera,
  Eye,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Receipt as ReceiptIcon
} from "lucide-react";

export default function Receipts() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: receipts, isLoading } = useQuery({
    queryKey: ["/api/receipts"],
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
    enabled: !!user,
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('receipt', file);
      return await apiRequest('POST', '/api/receipts/upload', formData);
    },
    onSuccess: (data) => {
      toast({
        title: "Receipt uploaded successfully",
        description: "Processing with OCR...",
      });
      setIsProcessing(true);
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Upload failed",
        description: "Failed to upload receipt. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      return await apiRequest('POST', '/api/transactions', transactionData);
    },
    onSuccess: () => {
      toast({
        title: "Transaction created",
        description: "Transaction has been added successfully.",
      });
      setOcrResult(null);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create transaction",
        description: "Please check the transaction details and try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      uploadReceiptMutation.mutate(file);
    }
  };

  const handleCreateTransaction = () => {
    if (!ocrResult || !accounts?.length) return;

    const transactionData = {
      description: ocrResult.merchant || 'Receipt Transaction',
      amount: ocrResult.amount?.toString() || '0',
      type: 'expense',
      category: ocrResult.category || 'other',
      accountId: accounts[0].id, // Default to first account
      date: ocrResult.date ? new Date(ocrResult.date) : new Date(),
    };

    createTransactionMutation.mutate(transactionData);
  };

  const clearForm = () => {
    setSelectedFile(null);
    setOcrResult(null);
    setIsProcessing(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Receipt Scanner</h1>
                <p className="text-gray-600">Upload and scan receipts to automatically create transactions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Receipt</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* File Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <div className="mb-4">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    </div>
                    <p className="text-lg text-gray-600 mb-2">Drop your receipt here or click to browse</p>
                    <p className="text-sm text-gray-500 mb-4">Supports JPG, PNG, PDF files up to 10MB</p>
                    <Button 
                      className="bg-primary hover:bg-blue-700"
                      onClick={() => document.getElementById('file-input')?.click()}
                      disabled={uploadReceiptMutation.isPending}
                    >
                      {uploadReceiptMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Choose File
                    </Button>
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Camera Option */}
                  <div className="mt-4 text-center">
                    <Button variant="ghost" className="text-primary hover:text-blue-700">
                      <Camera className="h-4 w-4 mr-1" />
                      Take Photo with Camera
                    </Button>
                  </div>

                  {/* Processing Status */}
                  {isProcessing && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-5 w-5 text-primary mr-3" />
                        <span className="text-blue-800 text-sm">Processing receipt with AI OCR...</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* OCR Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Extracted Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {ocrResult ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Merchant</label>
                        <Input
                          value={ocrResult.merchant || ''}
                          onChange={(e) => setOcrResult({ ...ocrResult, merchant: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <Input
                          type="date"
                          value={ocrResult.date || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setOcrResult({ ...ocrResult, date: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={ocrResult.amount || ''}
                          onChange={(e) => setOcrResult({ ...ocrResult, amount: parseFloat(e.target.value) })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <Select 
                          value={ocrResult.category || 'other'} 
                          onValueChange={(value) => setOcrResult({ ...ocrResult, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="groceries">Groceries</SelectItem>
                            <SelectItem value="transportation">Transportation</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                            <SelectItem value="utilities">Utilities</SelectItem>
                            <SelectItem value="dining">Dining</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                        <Select defaultValue={accounts?.[0]?.id}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts?.map((account: any) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4">
                        <Button 
                          className="flex-1 bg-primary hover:bg-blue-700"
                          onClick={handleCreateTransaction}
                          disabled={createTransactionMutation.isPending}
                        >
                          {createTransactionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Create Transaction
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={clearForm}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ReceiptIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Upload a receipt to see extracted information here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Scanned Receipts */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recent Scanned Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                          </div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                      </div>
                    ))}
                  </div>
                ) : receipts?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ReceiptIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No receipts uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receipts?.map((receipt: any) => (
                      <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ReceiptIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{receipt.fileName}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(receipt.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={
                            receipt.processedAt 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }>
                            {receipt.processedAt ? 'Processed' : 'Processing'}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
