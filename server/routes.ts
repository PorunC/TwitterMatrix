import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { botService } from "./services/botService";
import { TwitterService } from "./services/twitterService";
import { LLMService } from "./services/llmService";
import { insertBotSchema, insertActivitySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const twitterService = new TwitterService();
  const llmService = new LLMService();

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Bot routes
  app.get("/api/bots", async (req, res) => {
    try {
      const bots = await storage.getAllBots();
      res.json(bots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots", async (req, res) => {
    try {
      const validatedData = insertBotSchema.parse(req.body);
      const bot = await storage.createBot(validatedData);
      
      if (bot.isActive) {
        await botService.startBot(bot.id);
      }
      
      broadcast({ type: 'bot_created', bot });
      res.json(bot);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/bots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBotSchema.partial().parse(req.body);
      const bot = await storage.updateBot(id, validatedData);
      
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      
      // Restart bot if it was updated
      if (bot.isActive) {
        await botService.startBot(bot.id);
      } else {
        botService.stopBot(bot.id);
      }
      
      broadcast({ type: 'bot_updated', bot });
      res.json(bot);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/bots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      botService.stopBot(id);
      const deleted = await storage.deleteBot(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Bot not found" });
      }
      
      broadcast({ type: 'bot_deleted', botId: id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/pause", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await botService.pauseBot(id);
      const bot = await storage.getBot(id);
      
      broadcast({ type: 'bot_paused', bot });
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/resume", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await botService.resumeBot(id);
      const bot = await storage.getBot(id);
      
      broadcast({ type: 'bot_resumed', bot });
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Activity routes
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const botId = req.query.botId ? parseInt(req.query.botId as string) : undefined;
      
      const activities = await storage.getActivities(limit, botId);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Content generation routes
  app.post("/api/content/generate", async (req, res) => {
    try {
      const { topic, personality, botId } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
      }
      
      const content = await llmService.generateTweet(topic, personality || 'professional');
      
      if (botId) {
        await storage.createActivity({
          botId: parseInt(botId),
          action: 'generate',
          content,
          status: 'success',
        });
      }
      
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/content/post", async (req, res) => {
    try {
      const { content, botId } = req.body;
      
      if (!content || !botId) {
        return res.status(400).json({ error: "Content and botId are required" });
      }
      
      const result = await twitterService.postTweet(content, parseInt(botId));
      
      broadcast({ type: 'tweet_posted', botId, content });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const bots = await storage.getAllBots();
      const activities = await storage.getActivities(1000);
      
      const activeBots = bots.filter(bot => bot.isActive).length;
      const totalTweets = activities.filter(a => a.action === 'tweet').length;
      const totalApiCalls = activities.length;
      
      const twitterUsage = await storage.getApiUsage('twitter');
      const llmUsage = await storage.getApiUsage('llm');
      
      const stats = {
        activeBots,
        totalTweets,
        totalApiCalls,
        twitterApiCalls: twitterUsage?.callsCount || 0,
        twitterApiLimit: twitterUsage?.dailyLimit || 1000,
        llmApiCalls: llmUsage?.callsCount || 0,
        llmApiLimit: llmUsage?.dailyLimit || 100,
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API usage routes
  app.get("/api/usage", async (req, res) => {
    try {
      const twitterUsage = await storage.getApiUsage('twitter');
      const llmUsage = await storage.getApiUsage('llm');
      
      res.json({
        twitter: twitterUsage,
        llm: llmUsage,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test API connections
  app.post("/api/test-connection", async (req, res) => {
    try {
      const { service } = req.body;
      
      if (service === 'twitter') {
        const result = await twitterService.checkApiLimits();
        res.json({ success: true, data: result });
      } else if (service === 'llm') {
        const result = await llmService.generateTweet('test', 'professional');
        res.json({ success: true, data: { content: result } });
      } else {
        res.status(400).json({ error: "Invalid service. Use 'twitter' or 'llm'" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Initialize bot service
  await botService.initializeAllBots();

  return httpServer;
}
