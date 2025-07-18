import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportModal({ open, onOpenChange }: BulkImportModalProps) {
  const [importData, setImportData] = useState('');
  const [importType, setImportType] = useState<'csv' | 'xlsx'>('csv');
  const [template, setTemplate] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const templateQuery = useMutation({
    mutationFn: () => apiRequest('/api/bots/import-template'),
    onSuccess: (data) => {
      setTemplate(data);
    }
  });

  const importMutation = useMutation({
    mutationFn: (data: { data: string; type: string }) => 
      apiRequest('/api/bots/bulk-import', { method: 'POST', body: data }),
    onSuccess: (result) => {
      toast({
        title: "批量导入成功",
        description: `成功导入${result.imported}个机器人，${result.errors}个错误`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      onOpenChange(false);
      setImportData('');
    },
    onError: (error: any) => {
      toast({
        title: "导入失败",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      setImportType(file.name.endsWith('.xlsx') ? 'xlsx' : 'csv');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importData.trim()) {
      toast({
        title: "请输入数据",
        description: "请上传文件或直接输入CSV数据",
        variant: "destructive"
      });
      return;
    }

    importMutation.mutate({
      data: importData,
      type: importType
    });
  };

  const downloadTemplate = () => {
    if (!template) {
      templateQuery.mutate();
      return;
    }

    const blob = new Blob([template.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bot_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">批量导入机器人</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Download className="h-5 w-5" />
                下载模板
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                下载CSV模板文件，填写机器人信息后上传导入。模板包含机器人互动配置字段，支持设置机器人之间的互动行为。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-800 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">必填字段</h4>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• name - 机器人名称</li>
                  </ul>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">互动配置字段</h4>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• enableInteraction - 启用互动 (true/false)</li>
                    <li>• interactionFrequency - 互动频率 (分钟)</li>
                    <li>• interactionTargets - 目标机器人ID (逗号分隔)</li>
                    <li>• interactionBehavior - 互动行为 (friendly/neutral/aggressive/analytical)</li>
                  </ul>
                </div>
              </div>
              <Button 
                onClick={downloadTemplate} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={templateQuery.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                下载模板文件
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5" />
                上传文件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload" className="text-gray-300">
                    选择CSV或Excel文件
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                
                <div className="text-sm text-gray-400">
                  支持CSV和Excel格式，确保文件包含必要的列标题
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direct Input */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                直接输入数据
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-data" className="text-gray-300">
                    CSV数据（包含标题行）
                  </Label>
                  <Textarea
                    id="csv-data"
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="name,description,twitterUsername,twitterAuthToken,topics,personality,postFrequency,enableInteraction,interactionFrequency,interactionTargets,interactionBehavior&#10;TechBot,科技机器人,@techbot,token123,科技,professional,60,true,30,2,friendly"
                    className="bg-slate-600 border-slate-500 text-white min-h-[200px] font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Descriptions */}
          {template && (
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  字段说明
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.fields.map((field: any) => (
                    <div key={field.name} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400 font-mono text-sm">
                          {field.name}
                        </span>
                        {field.required && (
                          <span className="text-red-400 text-xs">*必填</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{field.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importData.trim() || importMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {importMutation.isPending ? '导入中...' : '开始导入'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}