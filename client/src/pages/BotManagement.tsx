import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { BotCard } from "../components/BotCard";
import { Bot } from "../types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BotManagement() {
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    topics: "",
    personality: "professional",
    postFrequency: 60,
    twitterUsername: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bots = [] } = useQuery<Bot[]>({
    queryKey: ["/api/bots"],
  });

  const createBot = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bots", {
        ...data,
        topics: data.topics.split(",").map((t: string) => t.trim()).filter(Boolean),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot created successfully" });
      setShowCreateBot(false);
      setFormData({
        name: "",
        description: "",
        topics: "",
        personality: "professional",
        postFrequency: 60,
        twitterUsername: "",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBot.mutate(formData);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white">Bot Management</h2>
          <p className="text-sm text-gray-400">Create and manage your Twitter bots</p>
        </div>
        <Dialog open={showCreateBot} onOpenChange={setShowCreateBot}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Bot</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Bot Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="e.g., TechBot_Alpha"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="twitterUsername">Twitter Username</Label>
                  <Input
                    id="twitterUsername"
                    value={formData.twitterUsername}
                    onChange={(e) => setFormData({ ...formData, twitterUsername: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="@username"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Describe what this bot does..."
                />
              </div>
              
              <div>
                <Label htmlFor="topics">Topics (comma-separated)</Label>
                <Input
                  id="topics"
                  value={formData.topics}
                  onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="AI, technology, startups"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="personality">Personality</Label>
                  <Select value={formData.personality} onValueChange={(value) => setFormData({ ...formData, personality: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postFrequency">Post Frequency (minutes)</Label>
                  <Input
                    id="postFrequency"
                    type="number"
                    min="30"
                    max="1440"
                    value={formData.postFrequency}
                    onChange={(e) => setFormData({ ...formData, postFrequency: parseInt(e.target.value) })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowCreateBot(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBot.isPending} className="bg-blue-600 hover:bg-blue-700">
                  {createBot.isPending ? "Creating..." : "Create Bot"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {bots.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">No bots created yet</p>
              <p className="text-sm text-gray-500 mt-2">Create your first bot to get started</p>
            </CardContent>
          </Card>
        ) : (
          bots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))
        )}
      </div>
    </div>
  );
}
