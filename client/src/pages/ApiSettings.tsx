import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, TestTube, Shield, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ApiSettings() {
  const [showKeys, setShowKeys] = useState({ twitter: false, llm: false });
  const [apiKeys, setApiKeys] = useState({
    twitter: "",
    llm: "",
  });
  const { toast } = useToast();

  const { data: usage } = useQuery({
    queryKey: ["/api/usage"],
  });

  const testConnection = useMutation({
    mutationFn: async (service: string) => {
      const response = await apiRequest("POST", "/api/test-connection", { service });
      return response.json();
    },
    onSuccess: (data, service) => {
      toast({ 
        title: "Connection successful", 
        description: `${service} API is working correctly` 
      });
    },
    onError: (error: any, service) => {
      toast({ 
        title: "Connection failed", 
        description: `${service} API: ${error.message}`,
        variant: "destructive"
      });
    },
  });

  const handleTestConnection = (service: string) => {
    testConnection.mutate(service);
  };

  const toggleKeyVisibility = (service: 'twitter' | 'llm') => {
    setShowKeys(prev => ({ ...prev, [service]: !prev[service] }));
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white">API Settings</h2>
        <p className="text-sm text-gray-400">Configure your API keys and monitor usage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Configuration */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="twitter-key" className="text-sm font-medium text-gray-300">
                apidance.pro API Key
              </Label>
              <div className="relative mt-2">
                <Input
                  id="twitter-key"
                  type={showKeys.twitter ? "text" : "password"}
                  value={apiKeys.twitter}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, twitter: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white pr-10"
                  placeholder="sk-..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => toggleKeyVisibility('twitter')}
                >
                  {showKeys.twitter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => handleTestConnection('twitter')}
                disabled={testConnection.isPending}
                className="mt-2 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </div>

            <div>
              <Label htmlFor="llm-key" className="text-sm font-medium text-gray-300">
                bianxie.ai API Key
              </Label>
              <div className="relative mt-2">
                <Input
                  id="llm-key"
                  type={showKeys.llm ? "text" : "password"}
                  value={apiKeys.llm}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, llm: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white pr-10"
                  placeholder="sk-..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => toggleKeyVisibility('llm')}
                >
                  {showKeys.llm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => handleTestConnection('llm')}
                disabled={testConnection.isPending}
                className="mt-2 bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Usage */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              API Usage & Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Twitter API</span>
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Active
                </Badge>
              </div>
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Calls Used</span>
                  <span className="text-white font-semibold">
                    {usage?.twitter?.callsCount || 0}/{usage?.twitter?.dailyLimit || 1000}
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ 
                      width: `${((usage?.twitter?.callsCount || 0) / (usage?.twitter?.dailyLimit || 1000)) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Resets at {new Date(usage?.twitter?.lastReset || new Date()).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">LLM API</span>
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  Active
                </Badge>
              </div>
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Calls Used</span>
                  <span className="text-white font-semibold">
                    {usage?.llm?.callsCount || 0}/{usage?.llm?.dailyLimit || 100}
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ 
                      width: `${((usage?.llm?.callsCount || 0) / (usage?.llm?.dailyLimit || 100)) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Resets at {new Date(usage?.llm?.lastReset || new Date()).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limiting Info */}
      <Card className="bg-slate-800 border-slate-700 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Rate Limiting Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Twitter API Limits</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• 1000 calls per day</li>
                <li>• 15 tweets per 15 minutes</li>
                <li>• 300 likes per hour</li>
                <li>• 50 follows per day</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">LLM API Limits</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• 100 calls per day</li>
                <li>• 20 calls per hour</li>
                <li>• 4000 tokens per request</li>
                <li>• GPT-4o model access</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
