import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload } from "lucide-react";
import { BotCard } from "../components/BotCard";
import { BulkImportModal } from "../components/BulkImportModal";
import { Bot } from "../types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BotManagement() {
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [showEditBot, setShowEditBot] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    topics: "",
    personality: "professional",
    postFrequency: 60,
    twitterUsername: "",
    twitterAuthToken: "",
    enableInteraction: true,
    interactionFrequency: 30,
    interactionTargets: "",
    interactionBehavior: "friendly",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bots = [] } = useQuery<Bot[]>({
    queryKey: ["/api/bots"],
  });

  const createBot = useMutation({
    mutationFn: async (data: any) => {
      const topics = data.topics ? data.topics.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
      const interactionTargets = data.interactionTargets ? 
        data.interactionTargets.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
      
      const response = await apiRequest("POST", "/api/bots", {
        ...data,
        topics: JSON.stringify(topics),
        interactionTargets: JSON.stringify(interactionTargets),
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
        twitterAuthToken: "",
        enableInteraction: true,
        interactionFrequency: 30,
        interactionTargets: "",
        interactionBehavior: "friendly",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateBot = useMutation({
    mutationFn: async (data: any) => {
      const topics = data.topics ? data.topics.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
      const interactionTargets = data.interactionTargets ? 
        data.interactionTargets.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
      
      const response = await apiRequest("PUT", `/api/bots/${editingBot?.id}`, {
        ...data,
        topics: JSON.stringify(topics),
        interactionTargets: JSON.stringify(interactionTargets),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot updated successfully" });
      setShowEditBot(false);
      setEditingBot(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      topics: "",
      personality: "professional",
      postFrequency: 60,
      twitterUsername: "",
      twitterAuthToken: "",
      enableInteraction: true,
      interactionFrequency: 30,
      interactionTargets: "",
      interactionBehavior: "friendly",
    });
  };

  const handleEdit = (bot: Bot) => {
    setEditingBot(bot);
    
    // Parse JSON strings back to comma-separated values for the form
    let topicsStr = "";
    let targetsStr = "";
    
    try {
      const topics = JSON.parse(bot.topics || "[]");
      topicsStr = topics.join(", ");
    } catch {}
    
    try {
      const targets = JSON.parse(bot.interactionTargets || "[]");
      targetsStr = targets.join(", ");
    } catch {}
    
    setFormData({
      name: bot.name,
      description: bot.description || "",
      topics: topicsStr,
      personality: bot.personality || "professional",
      postFrequency: bot.postFrequency,
      twitterUsername: bot.twitterUsername || "",
      twitterAuthToken: bot.twitterAuthToken || "",
      enableInteraction: bot.enableInteraction,
      interactionFrequency: bot.interactionFrequency,
      interactionTargets: targetsStr,
      interactionBehavior: bot.interactionBehavior || "friendly",
    });
    setShowEditBot(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBot) {
      updateBot.mutate(formData);
    } else {
      createBot.mutate(formData);
    }
  };

  const handleCloseModal = () => {
    setShowCreateBot(false);
    setShowEditBot(false);
    setEditingBot(null);
    resetForm();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white">Bot Management</h2>
          <p className="text-sm text-gray-400">Create and manage your Twitter bots</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowBulkImport(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
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
                    placeholder="Describe your bot's purpose..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="twitterAuthToken">Twitter Auth Token (optional)</Label>
                  <Input
                    id="twitterAuthToken"
                    value={formData.twitterAuthToken}
                    onChange={(e) => setFormData({ ...formData, twitterAuthToken: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Bearer token or API key"
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
                
                {/* Bot Interaction Settings */}
                <div className="border-t border-slate-700 pt-4">
                  <Label className="text-sm font-medium text-gray-300 mb-3 block">Bot Interaction Settings</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="enableInteraction">Enable Interaction</Label>
                      <Select 
                        value={formData.enableInteraction.toString()} 
                        onValueChange={(value) => setFormData({ ...formData, enableInteraction: value === 'true' })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="true">Enabled</SelectItem>
                          <SelectItem value="false">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="interactionFrequency">Interaction Frequency (minutes)</Label>
                      <Input
                        id="interactionFrequency"
                        type="number"
                        min="15"
                        max="1440"
                        value={formData.interactionFrequency}
                        onChange={(e) => setFormData({ ...formData, interactionFrequency: parseInt(e.target.value) })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="interactionBehavior">Interaction Behavior</Label>
                      <Select 
                        value={formData.interactionBehavior} 
                        onValueChange={(value) => setFormData({ ...formData, interactionBehavior: value })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="aggressive">Aggressive</SelectItem>
                          <SelectItem value="analytical">Analytical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="interactionTargets">Interaction Target IDs (comma-separated)</Label>
                      <Input
                        id="interactionTargets"
                        value={formData.interactionTargets}
                        onChange={(e) => setFormData({ ...formData, interactionTargets: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="1,2,3"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="ghost" onClick={handleCloseModal}>
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
      </div>

      {/* Edit Bot Dialog */}
      <Dialog open={showEditBot} onOpenChange={setShowEditBot}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Bot</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Bot Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="e.g., TechBot_Alpha"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-twitterUsername">Twitter Username</Label>
                <Input
                  id="edit-twitterUsername"
                  value={formData.twitterUsername}
                  onChange={(e) => setFormData({ ...formData, twitterUsername: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="@username"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Describe your bot's purpose..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-twitterAuthToken">Twitter Auth Token (optional)</Label>
              <Input
                id="edit-twitterAuthToken"
                value={formData.twitterAuthToken}
                onChange={(e) => setFormData({ ...formData, twitterAuthToken: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Bearer token or API key"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-topics">Topics (comma-separated)</Label>
              <Input
                id="edit-topics"
                value={formData.topics}
                onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="AI, technology, startups"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-personality">Personality</Label>
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
                <Label htmlFor="edit-postFrequency">Post Frequency (minutes)</Label>
                <Input
                  id="edit-postFrequency"
                  type="number"
                  min="30"
                  max="1440"
                  value={formData.postFrequency}
                  onChange={(e) => setFormData({ ...formData, postFrequency: parseInt(e.target.value) })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            
            {/* Bot Interaction Settings */}
            <div className="border-t border-slate-700 pt-4">
              <Label className="text-sm font-medium text-gray-300 mb-3 block">Bot Interaction Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-enableInteraction">Enable Interaction</Label>
                  <Select 
                    value={formData.enableInteraction.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, enableInteraction: value === 'true' })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-interactionFrequency">Interaction Frequency (minutes)</Label>
                  <Input
                    id="edit-interactionFrequency"
                    type="number"
                    min="15"
                    max="1440"
                    value={formData.interactionFrequency}
                    onChange={(e) => setFormData({ ...formData, interactionFrequency: parseInt(e.target.value) })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="edit-interactionBehavior">Interaction Behavior</Label>
                  <Select 
                    value={formData.interactionBehavior} 
                    onValueChange={(value) => setFormData({ ...formData, interactionBehavior: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                      <SelectItem value="analytical">Analytical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-interactionTargets">Interaction Target IDs (comma-separated)</Label>
                  <Input
                    id="edit-interactionTargets"
                    value={formData.interactionTargets}
                    onChange={(e) => setFormData({ ...formData, interactionTargets: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="1,2,3"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="ghost" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateBot.isPending} className="bg-blue-600 hover:bg-blue-700">
                {updateBot.isPending ? "Updating..." : "Update Bot"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BulkImportModal 
        open={showBulkImport} 
        onOpenChange={setShowBulkImport}
      />

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
            <BotCard key={bot.id} bot={bot} onEdit={handleEdit} />
          ))
        )}
      </div>
    </div>
  );
}