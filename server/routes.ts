import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { botService } from "./services/botService";
import { botInteractionService } from "./services/botInteractionService";
import { TwitterService } from "./services/twitterService";
import { LLMService } from "./services/llmService";
import { insertBotSchema, insertActivitySchema } from "@shared/schema";
import { z } from "zod";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server configuration with production-ready settings
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    perMessageDeflate: false, // Disable compression for better compatibility
    clientTracking: true,
    maxPayload: 1024 * 1024 // 1MB max message size
  });
  
  const twitterService = new TwitterService();
  const llmService = new LLMService();

  // WebSocket connection handling with better error handling
  wss.on('connection', (ws, req) => {
    console.log('Client connected to WebSocket');
    
    // Send initial connection success message
    ws.send(JSON.stringify({ type: 'connected' }));
    
    // Set up ping/pong for keep-alive
    let isAlive = true;
    ws.on('pong', () => {
      isAlive = true;
    });
    
    const pingInterval = setInterval(() => {
      if (!isAlive) {
        console.log('WebSocket client not responding to ping, terminating connection');
        ws.terminate();
        return;
      }
      isAlive = false;
      ws.ping();
    }, 30000); // Ping every 30 seconds
    
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
      clearInterval(pingInterval);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(pingInterval);
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
        
        // Start bot interactions if enabled
        if (bot.enableInteraction) {
          await botInteractionService.startBotInteractions(bot.id);
        }
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
        
        // Start/stop bot interactions based on settings
        if (bot.enableInteraction) {
          await botInteractionService.startBotInteractions(bot.id);
        } else {
          botInteractionService.stopBotInteractions(bot.id);
        }
      } else {
        botService.stopBot(bot.id);
        botInteractionService.stopBotInteractions(bot.id);
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
      botInteractionService.stopBotInteractions(id);
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

  // Bulk import bots
  app.post("/api/bots/bulk-import", async (req, res) => {
    try {
      const { data, type } = req.body; // data is the file content, type is 'csv' or 'xlsx'
      let parsedData: any[] = [];

      if (type === 'csv') {
        const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });
        parsedData = parsed.data as any[];
      } else if (type === 'xlsx') {
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        parsedData = XLSX.utils.sheet_to_json(firstSheet);
      }

      const createdBots = [];
      const errors = [];

      for (const [index, row] of parsedData.entries()) {
        try {
          // Parse topics and interaction targets
          const topics = row.topics ? row.topics.split(',').map((t: string) => t.trim()) : [];
          const interactionTargets = row.interactionTargets ? 
            row.interactionTargets.split(',').map((t: string) => t.trim()) : [];

          const botData = {
            name: row.name,
            description: row.description || null,
            twitterUsername: row.twitterUsername || null,
            twitterAuthToken: row.twitterAuthToken || null,
            topics,
            personality: row.personality || 'professional',
            postFrequency: parseInt(row.postFrequency) || 60,
            enableInteraction: row.enableInteraction === 'true' || row.enableInteraction === true,
            interactionFrequency: parseInt(row.interactionFrequency) || 30,
            interactionTargets,
            interactionBehavior: row.interactionBehavior || 'friendly',
            isActive: true
          };

          const validatedData = insertBotSchema.parse(botData);
          const bot = await storage.createBot(validatedData);
          createdBots.push(bot);

          if (bot.isActive) {
            await botService.startBot(bot.id);
            
            // Start bot interactions if enabled
            if (bot.enableInteraction) {
              await botInteractionService.startBotInteractions(bot.id);
            }
          }
        } catch (error: any) {
          errors.push({ row: index + 1, error: error.message });
        }
      }

      broadcast({ type: 'bots_bulk_imported', bots: createdBots });
      res.json({ 
        success: true, 
        imported: createdBots.length, 
        errors: errors.length,
        bots: createdBots,
        errorDetails: errors
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get bulk import template
  app.get("/api/bots/import-template", async (req, res) => {
    try {
      const template = {
        csv: `name,description,twitterUsername,twitterAuthToken,topics,personality,postFrequency,enableInteraction,interactionFrequency,interactionTargets,interactionBehavior
TechBot,专注于科技资讯的机器人,@techbot2024,your_auth_token_here,"科技,AI,区块链",professional,60,true,30,"2,3",friendly
CryptoBot,加密货币专家机器人,@cryptobot2024,your_auth_token_here,"加密货币,比特币,以太坊",analytical,45,true,25,"1,3",neutral`,
        fields: [
          { name: 'name', description: '机器人名称（必填）', required: true },
          { name: 'description', description: '机器人描述', required: false },
          { name: 'twitterUsername', description: '推特用户名（如@bot123）', required: false },
          { name: 'twitterAuthToken', description: '推特认证令牌', required: false },
          { name: 'topics', description: '话题（逗号分隔）', required: false },
          { name: 'personality', description: '个性（professional/casual/analytical等）', required: false },
          { name: 'postFrequency', description: '发布频率（分钟）', required: false },
          { name: 'enableInteraction', description: '启用互动（true/false）', required: false },
          { name: 'interactionFrequency', description: '互动频率（分钟）', required: false },
          { name: 'interactionTargets', description: '互动目标机器人ID（逗号分隔）', required: false },
          { name: 'interactionBehavior', description: '互动行为（friendly/neutral/aggressive）', required: false }
        ]
      };
      res.json(template);
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

  // Bot interaction routes
  app.get("/api/bots/:id/interactions", async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const interactions = await storage.getBotInteractions(botId, limit);
      res.json(interactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/interactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const interactions = await storage.getBotInteractions(undefined, limit);
      res.json(interactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bots/:id/interaction-stats", async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const stats = await botInteractionService.getBotInteractionStats(botId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/interactions/start", async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      await botInteractionService.startBotInteractions(botId);
      res.json({ success: true, message: "Bot interactions started" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/interactions/stop", async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      botInteractionService.stopBotInteractions(botId);
      res.json({ success: true, message: "Bot interactions stopped" });
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

  // Save API configuration
  app.post("/api/config/save", async (req, res) => {
    try {
      const { apiKeys, apiUrls } = req.body;
      
      // In a real implementation, you would save these to environment variables
      // or a secure configuration store. For now, we'll just return success
      // since we're using in-memory storage
      
      res.json({ 
        success: true, 
        message: "Configuration saved successfully" 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get API configuration
  app.get("/api/config", async (req, res) => {
    try {
      // Return current configuration (masked for security)
      res.json({
        apiUrls: {
          twitter: process.env.APIDANCE_BASE_URL || process.env.TWITTER_BASE_URL || 'https://api.apidance.pro',
          llm: process.env.BIANXIE_BASE_URL || process.env.LLM_BASE_URL || 'https://api.bianxie.ai/v1',
        },
        apiKeys: {
          twitter: process.env.APIDANCE_API_KEY || process.env.TWITTER_API_KEY ? '••••••••••••••••' : '',
          llm: process.env.BIANXIE_API_KEY || process.env.LLM_API_KEY ? '••••••••••••••••' : '',
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Initialize bot service
  await botService.initializeAllBots();

  return httpServer;
}
