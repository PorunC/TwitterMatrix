import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  MessageCircle, 
  Repeat, 
  UserPlus, 
  Search,
  Send,
  Loader2
} from 'lucide-react';

export function ManualInteractionPanel() {
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [tweetId, setTweetId] = useState('');
  const [userId, setUserId] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Search tweets
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/search/tweets', searchQuery],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/search/tweets?query=${encodeURIComponent(searchQuery)}&count=10`);
      return response.json();
    },
    enabled: !!searchQuery && searchQuery.length > 2,
  });

  // Manual interactions
  const likeTweet = useMutation({
    mutationFn: async ({ botId, tweetId }: { botId: number; tweetId: string }) => {
      const response = await apiRequest('POST', `/api/bots/${botId}/like`, { tweetId });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "点赞成功", description: "已成功点赞推文" });
      queryClient.invalidateQueries({ queryKey: ['/api/interactions'] });
    },
    onError: (error: any) => {
      toast({ title: "点赞失败", description: error.message, variant: "destructive" });
    }
  });

  const retweetTweet = useMutation({
    mutationFn: async ({ botId, tweetId }: { botId: number; tweetId: string }) => {
      const response = await apiRequest('POST', `/api/bots/${botId}/retweet`, { tweetId });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "转发成功", description: "已成功转发推文" });
      queryClient.invalidateQueries({ queryKey: ['/api/interactions'] });
    },
    onError: (error: any) => {
      toast({ title: "转发失败", description: error.message, variant: "destructive" });
    }
  });

  const replyToTweet = useMutation({
    mutationFn: async ({ botId, tweetId, content }: { botId: number; tweetId: string; content: string }) => {
      const response = await apiRequest('POST', `/api/bots/${botId}/reply`, { tweetId, content });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "回复成功", description: "已成功回复推文" });
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/interactions'] });
    },
    onError: (error: any) => {
      toast({ title: "回复失败", description: error.message, variant: "destructive" });
    }
  });

  const followUser = useMutation({
    mutationFn: async ({ botId, userId }: { botId: number; userId: string }) => {
      const response = await apiRequest('POST', `/api/bots/${botId}/follow`, { userId });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "关注成功", description: "已成功关注用户" });
      queryClient.invalidateQueries({ queryKey: ['/api/interactions'] });
    },
    onError: (error: any) => {
      toast({ title: "关注失败", description: error.message, variant: "destructive" });
    }
  });

  const selectedBotData = bots.find((bot: any) => bot.id.toString() === selectedBot);

  return (
    <div className="space-y-6">
      {/* 机器人选择 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">选择机器人</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedBot} onValueChange={setSelectedBot}>
            <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="请选择要执行互动的机器人..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {bots.map((bot: any) => (
                <SelectItem key={bot.id} value={bot.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <span>{bot.name}</span>
                    {bot.isActive && <Badge variant="outline" className="text-xs">活跃</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedBotData && (
        <>
          {/* 推文搜索 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Search className="h-5 w-5 mr-2" />
                推文搜索
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="输入搜索关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              {searchLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  <span className="ml-2 text-gray-400">搜索中...</span>
                </div>
              )}
              
              {searchResults && searchResults.data && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {/* 注意：这里需要根据实际的 API 响应结构来解析推文数据 */}
                  <div className="text-sm text-gray-400">
                    找到搜索结果，请使用推文ID进行手动互动
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 手动互动操作 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 点赞和转发 */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">点赞 & 转发</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    推文ID
                  </label>
                  <Input
                    placeholder="输入推文ID..."
                    value={tweetId}
                    onChange={(e) => setTweetId(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => likeTweet.mutate({ botId: selectedBotData.id, tweetId })}
                    disabled={!tweetId || likeTweet.isPending}
                    className="flex-1"
                    variant="outline"
                  >
                    <Heart className="h-4 w-4 mr-2 text-red-400" />
                    点赞
                  </Button>
                  <Button
                    onClick={() => retweetTweet.mutate({ botId: selectedBotData.id, tweetId })}
                    disabled={!tweetId || retweetTweet.isPending}
                    className="flex-1"
                    variant="outline"
                  >
                    <Repeat className="h-4 w-4 mr-2 text-green-400" />
                    转发
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 回复推文 */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">回复推文</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    推文ID
                  </label>
                  <Input
                    placeholder="输入要回复的推文ID..."
                    value={tweetId}
                    onChange={(e) => setTweetId(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    回复内容
                  </label>
                  <Textarea
                    placeholder="输入回复内容..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => replyToTweet.mutate({ 
                    botId: selectedBotData.id, 
                    tweetId, 
                    content: replyContent 
                  })}
                  disabled={!tweetId || !replyContent || replyToTweet.isPending}
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  发送回复
                </Button>
              </CardContent>
            </Card>

            {/* 关注用户 */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">关注用户</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    用户ID
                  </label>
                  <Input
                    placeholder="输入用户ID..."
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button
                  onClick={() => followUser.mutate({ botId: selectedBotData.id, userId })}
                  disabled={!userId || followUser.isPending}
                  className="w-full"
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4 mr-2 text-purple-400" />
                  关注用户
                </Button>
              </CardContent>
            </Card>

            {/* 机器人信息 */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">当前机器人信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">名称:</span>
                    <span className="text-white">{selectedBotData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">状态:</span>
                    <Badge variant={selectedBotData.isActive ? 'default' : 'secondary'}>
                      {selectedBotData.isActive ? '活跃' : '暂停'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">互动功能:</span>
                    <Badge variant={selectedBotData.enableInteraction ? 'default' : 'secondary'}>
                      {selectedBotData.enableInteraction ? '启用' : '禁用'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Twitter用户名:</span>
                    <span className="text-white">
                      {selectedBotData.twitterUsername || '未设置'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}