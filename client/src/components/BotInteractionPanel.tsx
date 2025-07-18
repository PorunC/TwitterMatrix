import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Repeat, 
  Play, 
  Pause, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDistance } from 'date-fns';

interface BotInteractionPanelProps {
  botId?: number;
}

export function BotInteractionPanel({ botId }: BotInteractionPanelProps) {
  const [selectedBot, setSelectedBot] = useState<string>(botId?.toString() || 'all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bots
  const { data: bots = [] } = useQuery({
    queryKey: ['/api/bots'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/bots');
      return response.json();
    },
  });

  // Fetch bot interactions
  const { data: interactions = [], isLoading: interactionsLoading } = useQuery({
    queryKey: ['/api/interactions', selectedBot],
    queryFn: async () => {
      const response = selectedBot && selectedBot !== 'all' ? 
        await apiRequest('GET', `/api/bots/${selectedBot}/interactions?limit=50`) :
        await apiRequest('GET', '/api/interactions?limit=50');
      return response.json();
    },
    enabled: true,
  });

  // Fetch interaction stats
  const { data: stats } = useQuery({
    queryKey: ['/api/bots', selectedBot, 'interaction-stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/bots/${selectedBot}/interaction-stats`);
      return response.json();
    },
    enabled: !!selectedBot && selectedBot !== 'all',
  });

  const startInteractions = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/bots/${id}/interactions/start`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "机器人互动已启动", description: "机器人将开始与其他机器人互动" });
      queryClient.invalidateQueries({ queryKey: ['/api/interactions'] });
    },
    onError: (error: any) => {
      toast({ title: "启动失败", description: error.message, variant: "destructive" });
    }
  });

  const stopInteractions = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/bots/${id}/interactions/stop`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "机器人互动已停止", description: "机器人已停止与其他机器人互动" });
      queryClient.invalidateQueries({ queryKey: ['/api/interactions'] });
    },
    onError: (error: any) => {
      toast({ title: "停止失败", description: error.message, variant: "destructive" });
    }
  });

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4 text-red-400" />;
      case 'reply': return <MessageCircle className="h-4 w-4 text-blue-400" />;
      case 'retweet': return <Repeat className="h-4 w-4 text-green-400" />;
      default: return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const selectedBotData = bots.find((bot: any) => bot.id.toString() === selectedBot);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">机器人互动管理</h2>
        <div className="flex items-center space-x-4">
          <Select value={selectedBot} onValueChange={setSelectedBot}>
            <SelectTrigger className="w-64 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="选择机器人..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all">所有机器人</SelectItem>
              {bots.map((bot: any) => (
                <SelectItem key={bot.id} value={bot.id.toString()}>
                  {bot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedBotData && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => startInteractions.mutate(selectedBotData.id)}
                disabled={startInteractions.isPending}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                启动互动
              </Button>
              <Button
                onClick={() => stopInteractions.mutate(selectedBotData.id)}
                disabled={stopInteractions.isPending}
                size="sm"
                variant="destructive"
              >
                <Pause className="h-4 w-4 mr-2" />
                停止互动
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="interactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
          <TabsTrigger value="interactions" className="text-white">互动记录</TabsTrigger>
          <TabsTrigger value="stats" className="text-white">统计数据</TabsTrigger>
          <TabsTrigger value="settings" className="text-white">互动设置</TabsTrigger>
        </TabsList>

        <TabsContent value="interactions" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2" />
                机器人互动记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {interactionsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-400">加载中...</div>
                  </div>
                ) : interactions.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-400">暂无互动记录</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interactions.map((interaction: any) => (
                      <div key={interaction.id} className="bg-slate-700 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {getInteractionIcon(interaction.metadata?.interactionType)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-white">
                                  {bots.find((b: any) => b.id === interaction.botId)?.name}
                                </span>
                                <span className="text-gray-400">
                                  {interaction.metadata?.interactionType === 'like' ? '点赞了' :
                                   interaction.metadata?.interactionType === 'reply' ? '回复了' :
                                   interaction.metadata?.interactionType === 'retweet' ? '转发了' : '互动了'}
                                </span>
                                <span className="font-medium text-blue-400">
                                  {interaction.metadata?.targetBot}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm">{interaction.content}</p>
                              <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                                <span>{formatDistance(new Date(interaction.createdAt), new Date(), { addSuffix: true })}</span>
                                {interaction.tweetId && (
                                  <Badge variant="outline" className="text-xs">
                                    推文ID: {interaction.tweetId}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(interaction.status)}
                            <Badge 
                              variant={interaction.status === 'success' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {interaction.status === 'success' ? '成功' : '失败'}
                            </Badge>
                          </div>
                        </div>
                        {interaction.errorMessage && (
                          <div className="mt-2 p-2 bg-red-900/30 rounded text-red-300 text-sm">
                            错误: {interaction.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">总互动数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalInteractions}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">成功互动</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">{stats.successfulInteractions}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">失败互动</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">{stats.failedInteractions}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">成功率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.totalInteractions > 0 ? 
                      `${Math.round((stats.successfulInteractions / stats.totalInteractions) * 100)}%` : 
                      '0%'
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {stats && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  互动类型统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-red-400" />
                      <span className="text-gray-300">点赞</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{stats.interactionsByType.likes}</span>
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-red-400 h-2 rounded-full" 
                          style={{
                            width: `${stats.totalInteractions > 0 ? (stats.interactionsByType.likes / stats.totalInteractions) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">回复</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{stats.interactionsByType.replies}</span>
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-blue-400 h-2 rounded-full" 
                          style={{
                            width: `${stats.totalInteractions > 0 ? (stats.interactionsByType.replies / stats.totalInteractions) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Repeat className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300">转发</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{stats.interactionsByType.retweets}</span>
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full" 
                          style={{
                            width: `${stats.totalInteractions > 0 ? (stats.interactionsByType.retweets / stats.totalInteractions) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">互动设置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-gray-300">
                  <h3 className="font-medium mb-2">当前机器人互动配置</h3>
                  {selectedBotData ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>启用互动:</span>
                        <Badge variant={selectedBotData.enableInteraction ? 'default' : 'secondary'}>
                          {selectedBotData.enableInteraction ? '启用' : '禁用'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>互动频率:</span>
                        <span>{selectedBotData.interactionFrequency || 30} 分钟</span>
                      </div>
                      <div className="flex justify-between">
                        <span>互动行为:</span>
                        <Badge variant="outline">
                          {selectedBotData.interactionBehavior === 'friendly' ? '友好' :
                           selectedBotData.interactionBehavior === 'neutral' ? '中性' :
                           selectedBotData.interactionBehavior === 'aggressive' ? '积极' :
                           selectedBotData.interactionBehavior === 'analytical' ? '分析' : 
                           selectedBotData.interactionBehavior}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>互动目标:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedBotData.interactionTargets && selectedBotData.interactionTargets.length > 0 ? (
                            selectedBotData.interactionTargets.map((targetId: string) => {
                              const targetBot = bots.find((b: any) => b.id.toString() === targetId);
                              return targetBot ? (
                                <Badge key={targetId} variant="outline" className="text-xs">
                                  {targetBot.name}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-gray-400">无</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">请选择一个机器人查看配置</div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm text-gray-400 mb-2">
                    要修改互动设置，请前往机器人管理页面编辑具体的机器人配置。
                  </p>
                  <p className="text-sm text-gray-400">
                    机器人会根据设置的频率和行为与目标机器人进行互动，包括点赞、回复和转发等操作。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}