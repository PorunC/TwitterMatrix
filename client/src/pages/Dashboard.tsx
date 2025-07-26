import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, Users, PlayCircle, PauseCircle, Zap } from "lucide-react";
import { Bot, Cloud, Heart, Twitter } from "lucide-react";
import { StatsCard } from "../components/StatsCard";
import { BotCard } from "../components/BotCard";
import { ActivityFeed } from "../components/ActivityFeed";
import { ContentGenerationModal } from "../components/ContentGenerationModal";
import { Bot as BotType, Activity, Stats } from "../types";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [showContentModal, setShowContentModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bots = [] } = useQuery<BotType[]>({
    queryKey: ["/api/bots"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/analytics/stats"],
  });

  const { isConnected, addMessageHandler } = useWebSocket();
  
  useEffect(() => {
    const removeHandler = addMessageHandler((message) => {
      // Handle real-time updates
      console.log("Dashboard WebSocket message:", message);
    });
    
    return removeHandler;
  }, [addMessageHandler]);

  const activeBots = bots.filter(bot => bot.isActive);
  const recentActivities = activities.slice(0, 5);
  const interactionEnabledBots = bots.filter(bot => bot.enableInteraction);

  // Batch interaction controls
  const startAllInteractions = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/interactions/start-all');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "批量启动成功", description: `已启动 ${data.started} 个机器人的互动功能` });
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
    },
    onError: (error: any) => {
      toast({ title: "批量启动失败", description: error.message, variant: "destructive" });
    }
  });

  const stopAllInteractions = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/interactions/stop-all');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "批量停止成功", description: "已停止所有机器人的互动功能" });
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
    },
    onError: (error: any) => {
      toast({ title: "批量停止失败", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white">Dashboard</h2>
          <p className="text-sm text-gray-400">Monitor your autonomous Twitter bot matrix</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setShowContentModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
          <div className="relative">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activities.filter(a => a.status === 'failed').length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-gray-400">
              System Online
            </span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Active Bots"
          value={stats?.activeBots || 0}
          icon={Bot}
          iconColor="bg-blue-600"
          trend={{ value: `${activeBots.length} running`, isPositive: true }}
        />
        <StatsCard
          title="Tweets Generated"
          value={stats?.totalTweets || 0}
          icon={Twitter}
          iconColor="bg-emerald-600"
          trend={{ value: "15% from last week", isPositive: true }}
        />
        <StatsCard
          title="API Calls"
          value={stats?.totalApiCalls || 0}
          icon={Cloud}
          iconColor="bg-amber-600"
          trend={{ value: `${stats?.twitterApiLimit ? stats.twitterApiLimit - stats.twitterApiCalls : 0} remaining`, isPositive: false }}
        />
        <StatsCard
          title="Engagement Rate"
          value="4.2%"
          icon={Heart}
          iconColor="bg-purple-600"
          trend={{ value: "0.8% increase", isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bot Activity */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Active Bots</CardTitle>
                <Button variant="link" className="text-blue-400 hover:text-blue-300">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeBots.length === 0 ? (
                  <p className="text-gray-400 text-sm">No active bots</p>
                ) : (
                  activeBots.slice(0, 3).map((bot) => (
                    <BotCard key={bot.id} bot={bot} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <ActivityFeed activities={recentActivities} />

          {/* API Configuration */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">API Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    apidance.pro API Key
                  </label>
                  <div className="relative">
                    <input 
                      type="password" 
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="sk-..." 
                      value="sk-••••••••••••••••"
                      readOnly
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    bianxie.ai API Key
                  </label>
                  <div className="relative">
                    <input 
                      type="password" 
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="sk-..." 
                      value="sk-••••••••••••••••"
                      readOnly
                    />
                  </div>
                </div>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bot Interactions Control */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2" />
                机器人互动控制
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {interactionEnabledBots.length}
                  </div>
                  <div className="text-sm text-gray-400">
                    启用互动的机器人
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => startAllInteractions.mutate()}
                    disabled={startAllInteractions.isPending}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    启动全部互动
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => stopAllInteractions.mutate()}
                    disabled={stopAllInteractions.isPending}
                  >
                    <PauseCircle className="h-4 w-4 mr-2" />
                    停止全部互动
                  </Button>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open('/bot-interactions', '_blank')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    管理互动
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowContentModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Tweet
                </Button>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Twitter className="h-4 w-4 mr-2" />
                  Search Topics
                </Button>
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  <Heart className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ContentGenerationModal 
        open={showContentModal}
        onOpenChange={setShowContentModal}
      />
    </div>
  );
}
