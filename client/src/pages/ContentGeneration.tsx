import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Sparkles, Twitter } from "lucide-react";
import { Bot as BotType } from "../types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ContentGeneration() {
  const [selectedBot, setSelectedBot] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [customContent, setCustomContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bots = [] } = useQuery<BotType[]>({
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
      setGeneratedContent("");
      setCustomContent("");
      setTopic("");
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

    const bot = bots.find(b => b.id.toString() === selectedBot);
    generateContent.mutate({
      topic,
      personality: bot?.personality || 'professional',
      botId: selectedBot,
    });
  };

  const handlePostGenerated = () => {
    if (!generatedContent || !selectedBot) {
      toast({ title: "Error", description: "Please generate content first", variant: "destructive" });
      return;
    }

    postTweet.mutate({
      content: generatedContent,
      botId: selectedBot,
    });
  };

  const handlePostCustom = () => {
    if (!customContent || !selectedBot) {
      toast({ title: "Error", description: "Please enter content and select a bot", variant: "destructive" });
      return;
    }

    postTweet.mutate({
      content: customContent,
      botId: selectedBot,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white">Content Generation</h2>
        <p className="text-sm text-gray-400">Generate and post content for your Twitter bots</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="ai-generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="ai-generate" className="text-white">AI Generation</TabsTrigger>
            <TabsTrigger value="manual" className="text-white">Manual Content</TabsTrigger>
          </TabsList>

          <TabsContent value="ai-generate" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  AI Content Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bot-select" className="text-sm font-medium text-gray-300">
                      Select Bot
                    </Label>
                    <Select value={selectedBot} onValueChange={setSelectedBot}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Choose a bot..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {bots.map((bot) => (
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
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., AI advancements, cryptocurrency trends..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="generated-content" className="text-sm font-medium text-gray-300">
                    Generated Content
                  </Label>
                  <Textarea
                    id="generated-content"
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white min-h-32"
                    placeholder="Click 'Generate' to create AI-powered tweet content..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {generatedContent.length}/280 characters
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={generateContent.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generateContent.isPending ? "Generating..." : "Generate"}
                  </Button>
                  <Button
                    onClick={handlePostGenerated}
                    disabled={postTweet.isPending || !generatedContent}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    {postTweet.isPending ? "Posting..." : "Post Tweet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  Manual Content Creation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bot-select-manual" className="text-sm font-medium text-gray-300">
                    Select Bot
                  </Label>
                  <Select value={selectedBot} onValueChange={setSelectedBot}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Choose a bot..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {bots.map((bot) => (
                        <SelectItem key={bot.id} value={bot.id.toString()}>
                          {bot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="custom-content" className="text-sm font-medium text-gray-300">
                    Tweet Content
                  </Label>
                  <Textarea
                    id="custom-content"
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white min-h-32"
                    placeholder="Write your tweet content here..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {customContent.length}/280 characters
                  </p>
                </div>

                <Button
                  onClick={handlePostCustom}
                  disabled={postTweet.isPending || !customContent}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  {postTweet.isPending ? "Posting..." : "Post Tweet"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
