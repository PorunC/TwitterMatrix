import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bot } from "../types";

interface ContentGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentGenerationModal({ open, onOpenChange }: ContentGenerationModalProps) {
  const [selectedBot, setSelectedBot] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bots } = useQuery<Bot[]>({
    queryKey: ["/api/bots"],
  });

  const generateContent = useMutation({
    mutationFn: async ({ topic, personality, botId }: { topic: string; personality: string; botId: string }) => {
      const response = await apiRequest("POST", "/api/content/generate", {
        topic,
        personality,
        botId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      toast({ title: "Content generated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const postTweet = useMutation({
    mutationFn: async ({ content, botId }: { content: string; botId: string }) => {
      const response = await apiRequest("POST", "/api/content/post", {
        content,
        botId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({ title: "Tweet posted successfully" });
      onOpenChange(false);
      setTopic("");
      setGeneratedContent("");
      setSelectedBot("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!topic || !selectedBot) {
      toast({ title: "Error", description: "Please select a bot and enter a topic", variant: "destructive" });
      return;
    }

    const bot = bots?.find(b => b.id.toString() === selectedBot);
    generateContent.mutate({
      topic,
      personality: bot?.personality || 'professional',
      botId: selectedBot,
    });
  };

  const handlePost = () => {
    if (!generatedContent || !selectedBot) {
      toast({ title: "Error", description: "Please generate content first", variant: "destructive" });
      return;
    }

    postTweet.mutate({
      content: generatedContent,
      botId: selectedBot,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Generate Tweet Content</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="bot-select" className="text-sm font-medium text-gray-300">
              Select Bot
            </Label>
            <Select value={selectedBot} onValueChange={setSelectedBot}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Choose a bot..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {bots?.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id.toString()}>
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="topic" className="text-sm font-medium text-gray-300">
              Content Topic
            </Label>
            <Input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="e.g., AI advancements, cryptocurrency trends..."
            />
          </div>
          
          <div>
            <Label htmlFor="content" className="text-sm font-medium text-gray-300">
              Generated Content
            </Label>
            <Textarea
              id="content"
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white min-h-24"
              placeholder="Click 'Generate' to create AI-powered tweet content..."
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={generateContent.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generateContent.isPending ? "Generating..." : "Generate"}
            </Button>
            <Button 
              onClick={handlePost}
              disabled={postTweet.isPending || !generatedContent}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {postTweet.isPending ? "Posting..." : "Post Tweet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
