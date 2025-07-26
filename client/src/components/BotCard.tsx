import { Bot } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot as BotIcon, Edit, Pause, Play, Trash2, Users, Zap, BarChart3 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface BotCardProps {
  bot: Bot;
  onEdit?: (bot: Bot) => void;
}

export function BotCard({ bot, onEdit }: BotCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const pauseBot = useMutation({
    mutationFn: () => apiRequest("POST", `/api/bots/${bot.id}/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot paused successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resumeBot = useMutation({
    mutationFn: () => apiRequest("POST", `/api/bots/${bot.id}/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot resumed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteBot = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/bots/${bot.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const startInteractions = useMutation({
    mutationFn: () => apiRequest("POST", `/api/bots/${bot.id}/interactions/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "机器人互动已启动", description: "机器人将开始与其他机器人互动" });
    },
    onError: (error: any) => {
      toast({ title: "启动失败", description: error.message, variant: "destructive" });
    },
  });

  const stopInteractions = useMutation({
    mutationFn: () => apiRequest("POST", `/api/bots/${bot.id}/interactions/stop`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "机器人互动已停止", description: "机器人已停止与其他机器人互动" });
    },
    onError: (error: any) => {
      toast({ title: "停止失败", description: error.message, variant: "destructive" });
    },
  });

  const triggerTopicInteraction = useMutation({
    mutationFn: () => apiRequest("POST", `/api/bots/${bot.id}/interactions/topic`),
    onSuccess: () => {
      toast({ title: "话题互动已触发", description: "机器人将基于话题进行互动" });
    },
    onError: (error: any) => {
      toast({ title: "触发失败", description: error.message, variant: "destructive" });
    },
  });

  const gradientColors = [
    "from-blue-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-pink-500 to-rose-600",
    "from-indigo-500 to-blue-600",
  ];

  const gradientIndex = bot.id % gradientColors.length;

  return (
    <Card className="bg-slate-700 border-slate-600">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className={`w-10 h-10 bg-gradient-to-br ${gradientColors[gradientIndex]} rounded-full flex items-center justify-center`}>
              <BotIcon className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <h4 className="font-medium text-white">{bot.name}</h4>
              <p className="text-sm text-gray-400">{bot.description || "No description"}</p>
              <div className="flex items-center space-x-3 mt-2">
                <Badge variant={bot.isActive ? "default" : "secondary"} className="text-xs">
                  {bot.isActive ? "Active" : "Paused"}
                </Badge>
                {bot.enableInteraction && (
                  <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                    <Users className="h-3 w-3 mr-1" />
                    互动启用
                  </Badge>
                )}
                {bot.topics && (() => {
                  try {
                    const parsedTopics = JSON.parse(bot.topics || '[]');
                    return parsedTopics.length > 0 ? (
                      <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                        话题: {parsedTopics.length}
                      </Badge>
                    ) : null;
                  } catch {
                    return null;
                  }
                })()}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {bot.lastTweetTime 
                  ? formatDistanceToNow(new Date(bot.lastTweetTime), { addSuffix: true })
                  : "Never posted"
                }
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            {/* 基本控制按钮 */}
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-blue-400"
                onClick={() => onEdit?.(bot)}
                title="编辑机器人"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-green-400"
                onClick={() => bot.isActive ? pauseBot.mutate() : resumeBot.mutate()}
                disabled={pauseBot.isPending || resumeBot.isPending}
              >
                {bot.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-red-400"
                onClick={() => deleteBot.mutate()}
                disabled={deleteBot.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 互动控制按钮 */}
            {bot.enableInteraction && (
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-purple-400 hover:text-purple-300 px-2"
                  onClick={() => startInteractions.mutate()}
                  disabled={startInteractions.isPending}
                  title="启动机器人互动"
                >
                  <Users className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-orange-400 hover:text-orange-300 px-2"
                  onClick={() => triggerTopicInteraction.mutate()}
                  disabled={triggerTopicInteraction.isPending}
                  title="触发话题互动"
                >
                  <Zap className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-cyan-400 hover:text-cyan-300 px-2"
                  onClick={() => window.open(`/bot-interactions?bot=${bot.id}`, '_blank')}
                  title="查看互动统计"
                >
                  <BarChart3 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
