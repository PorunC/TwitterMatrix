import { Bot } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot as BotIcon, Edit, Pause, Play, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface BotCardProps {
  bot: Bot;
}

export function BotCard({ bot }: BotCardProps) {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-10 h-10 bg-gradient-to-br ${gradientColors[gradientIndex]} rounded-full flex items-center justify-center`}>
              <BotIcon className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <h4 className="font-medium text-white">{bot.name}</h4>
              <p className="text-sm text-gray-400">{bot.description || "No description"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <Badge variant={bot.isActive ? "default" : "secondary"}>
                {bot.isActive ? "Active" : "Paused"}
              </Badge>
              <p className="text-xs text-gray-400 mt-1">
                {bot.lastTweetTime 
                  ? formatDistanceToNow(new Date(bot.lastTweetTime), { addSuffix: true })
                  : "Never posted"
                }
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
