import type { Express } from "express";
import { createServer, type Server } from "http";
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
  
  const twitterService = new TwitterService();
  const llmService = new LLMService();

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
      
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bot = await storage.getBot(id);
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/bots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBotSchema.parse(req.body);
      const bot = await storage.updateBot(id, validatedData);
      
      // Restart bot if it was active
      if (bot.isActive) {
        await botService.restartBot(id);
      }
      
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/bots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await botService.stopBot(id);
      await storage.deleteBot(id);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await botService.startBot(id);
      const bot = await storage.getBot(id);
      
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await botService.stopBot(id);
      const bot = await storage.getBot(id);
      
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk import routes
  app.post("/api/bots/bulk-import", async (req, res) => {
    try {
      const { data, format } = req.body;
      
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: "Invalid data format" });
      }

      const createdBots = [];
      const errors = [];

      for (const [index, row] of data.entries()) {
        try {
          // Parse CSV row data
          const botData = {
            name: row.name,
            description: row.description || "",
            twitterUsername: row.twitterUsername || "",
            twitterAuthToken: row.twitterAuthToken || "",
            topics: row.topics ? row.topics.split(',').map((t: string) => t.trim()) : [],
            personality: row.personality || "professional",
            postFrequency: row.postFrequency ? parseInt(row.postFrequency) : 60,
            isActive: row.isActive === "true" || row.isActive === true,
            enableInteraction: row.enableInteraction === "true" || row.enableInteraction === true,
            interactionFrequency: row.interactionFrequency ? parseInt(row.interactionFrequency) : 30,
            interactionTargets: row.interactionTargets ? 
              row.interactionTargets.split(',').map((t: string) => parseInt(t.trim())).filter(Boolean) : [],
            interactionBehavior: row.interactionBehavior || "friendly"
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

      const content = await llmService.generateContent(topic, personality);
      
      // Log activity
      if (botId) {
        await storage.createActivity({
          botId,
          type: "content_generation",
          content: JSON.stringify({ topic, personality, result: content }),
          status: "success"
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

      const bot = await storage.getBot(botId);
      if (!bot.twitterAuthToken) {
        return res.status(400).json({ error: "Bot does not have Twitter authentication" });
      }

      const result = await twitterService.postTweet(content, bot.twitterAuthToken);
      
      // Log activity
      await storage.createActivity({
        botId,
        type: "tweet_post",
        content: JSON.stringify({ content, result }),
        status: result ? "success" : "failed"
      });

      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const bots = await storage.getAllBots();
      const activities = await storage.getActivities(1000);
      
      const stats = {
        activeBots: bots.filter(bot => bot.isActive).length,
        totalBots: bots.length,
        totalTweets: activities.filter(a => a.type === 'tweet_post').length,
        totalInteractions: activities.filter(a => a.type === 'bot_interaction').length,
        successRate: activities.length > 0 ? 
          (activities.filter(a => a.status === 'success').length / activities.length * 100).toFixed(1) : 0
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API usage routes
  app.get("/api/usage", async (req, res) => {
    try {
      const usage = await storage.getApiUsage();
      res.json(usage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/usage/update", async (req, res) => {
    try {
      const { service, endpoint, count } = req.body;
      await storage.updateApiUsage(service, endpoint, count);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = {
        twitterApiKey: process.env.APIDANCE_API_KEY || process.env.TWITTER_API_KEY || "",
        llmApiKey: process.env.BIANXIE_API_KEY || process.env.LLM_API_KEY || "",
        twitterBaseUrl: process.env.APIDANCE_BASE_URL || process.env.TWITTER_BASE_URL || "https://api.apidance.pro",
        llmBaseUrl: process.env.BIANXIE_BASE_URL || process.env.LLM_BASE_URL || "https://api.bianxie.ai/v1"
      };
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { twitterApiKey, llmApiKey, twitterBaseUrl, llmBaseUrl } = req.body;
      
      // Update service configurations
      if (twitterApiKey) twitterService.setApiKey(twitterApiKey);
      if (llmApiKey) llmService.setApiKey(llmApiKey);
      if (twitterBaseUrl) twitterService.setBaseUrl(twitterBaseUrl);
      if (llmBaseUrl) llmService.setBaseUrl(llmBaseUrl);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}