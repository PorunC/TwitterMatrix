import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell } from "lucide-react";
import { Bot, Cloud, Heart, Twitter } from "lucide-react";
import { StatsCard } from "../components/StatsCard";
import { BotCard } from "../components/BotCard";
import { ActivityFeed } from "../components/ActivityFeed";
import { ContentGenerationModal } from "../components/ContentGenerationModal";
import { Bot as BotType, Activity, Stats } from "../types";
import { useWebSocket } from "../hooks/useWebSocket";

export default function Dashboard() {
  const [showContentModal, setShowContentModal] = useState(false);

  const { data: bots = [] } = useQuery<BotType[]>({
    queryKey: ["/api/bots"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/analytics/stats"],
  });

  const { isConnected } = useWebSocket((message) => {
    // Handle real-time updates
    console.log("WebSocket message:", message);
  });

  const activeBots = bots.filter(bot => bot.isActive);
  const recentActivities = activities.slice(0, 5);

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
            New Bot
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
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
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
