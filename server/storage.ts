import { 
  users, 
  bots, 
  activities, 
  apiUsage,
  type User, 
  type InsertUser, 
  type Bot, 
  type InsertBot, 
  type Activity, 
  type InsertActivity,
  type ApiUsage,
  type InsertApiUsage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bot methods
  getAllBots(): Promise<Bot[]>;
  getBot(id: number): Promise<Bot | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: number, bot: Partial<InsertBot>): Promise<Bot | undefined>;
  deleteBot(id: number): Promise<boolean>;
  
  // Activity methods
  getActivities(limit?: number, botId?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByBot(botId: number, limit?: number): Promise<Activity[]>;
  
  // API Usage methods
  getApiUsage(service: string): Promise<ApiUsage | undefined>;
  updateApiUsage(service: string, usage: Partial<InsertApiUsage>): Promise<ApiUsage>;
  incrementApiCall(service: string, endpoint: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bots: Map<number, Bot>;
  private activities: Map<number, Activity>;
  private apiUsage: Map<string, ApiUsage>;
  private currentUserId: number;
  private currentBotId: number;
  private currentActivityId: number;
  private currentApiUsageId: number;

  constructor() {
    this.users = new Map();
    this.bots = new Map();
    this.activities = new Map();
    this.apiUsage = new Map();
    this.currentUserId = 1;
    this.currentBotId = 1;
    this.currentActivityId = 1;
    this.currentApiUsageId = 1;
    
    // Initialize with default API usage tracking
    this.initializeApiUsage();
  }

  private initializeApiUsage() {
    const twitterUsage: ApiUsage = {
      id: this.currentApiUsageId++,
      service: 'twitter',
      endpoint: 'general',
      callsCount: 0,
      lastReset: new Date(),
      dailyLimit: 1000,
      createdAt: new Date(),
    };
    
    const llmUsage: ApiUsage = {
      id: this.currentApiUsageId++,
      service: 'llm',
      endpoint: 'general',
      callsCount: 0,
      lastReset: new Date(),
      dailyLimit: 100,
      createdAt: new Date(),
    };
    
    this.apiUsage.set('twitter', twitterUsage);
    this.apiUsage.set('llm', llmUsage);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllBots(): Promise<Bot[]> {
    return Array.from(this.bots.values());
  }

  async getBot(id: number): Promise<Bot | undefined> {
    return this.bots.get(id);
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const id = this.currentBotId++;
    const bot: Bot = { 
      ...insertBot,
      description: insertBot.description || null,
      isActive: insertBot.isActive ?? true,
      twitterUsername: insertBot.twitterUsername || null,
      twitterAuthToken: insertBot.twitterAuthToken || null,
      topics: insertBot.topics || null,
      personality: insertBot.personality || null,
      postFrequency: insertBot.postFrequency || 60,
      lastTweetTime: insertBot.lastTweetTime || null,
      enableInteraction: insertBot.enableInteraction ?? true,
      interactionFrequency: insertBot.interactionFrequency || 30,
      interactionTargets: insertBot.interactionTargets || null,
      interactionBehavior: insertBot.interactionBehavior || 'friendly',
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bots.set(id, bot);
    return bot;
  }

  async updateBot(id: number, botUpdate: Partial<InsertBot>): Promise<Bot | undefined> {
    const existingBot = this.bots.get(id);
    if (!existingBot) return undefined;
    
    const updatedBot: Bot = {
      ...existingBot,
      ...botUpdate,
      updatedAt: new Date(),
    };
    this.bots.set(id, updatedBot);
    return updatedBot;
  }

  async deleteBot(id: number): Promise<boolean> {
    return this.bots.delete(id);
  }

  async getActivities(limit = 50, botId?: number): Promise<Activity[]> {
    let activities = Array.from(this.activities.values());
    
    if (botId) {
      activities = activities.filter(activity => activity.botId === botId);
    }
    
    return activities
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      ...insertActivity,
      content: insertActivity.content || null,
      botId: insertActivity.botId || null,
      tweetId: insertActivity.tweetId || null,
      targetUser: insertActivity.targetUser || null,
      targetBotId: insertActivity.targetBotId || null,
      errorMessage: insertActivity.errorMessage || null,
      metadata: insertActivity.metadata || null,
      id,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getActivitiesByBot(botId: number, limit = 50): Promise<Activity[]> {
    return this.getActivities(limit, botId);
  }

  async getApiUsage(service: string): Promise<ApiUsage | undefined> {
    return this.apiUsage.get(service);
  }

  async updateApiUsage(service: string, usage: Partial<InsertApiUsage>): Promise<ApiUsage> {
    const existing = this.apiUsage.get(service);
    if (!existing) {
      const newUsage: ApiUsage = {
        id: this.currentApiUsageId++,
        service,
        endpoint: usage.endpoint || 'general',
        callsCount: usage.callsCount || 0,
        lastReset: usage.lastReset || new Date(),
        dailyLimit: usage.dailyLimit || 1000,
        createdAt: new Date(),
      };
      this.apiUsage.set(service, newUsage);
      return newUsage;
    }
    
    const updated: ApiUsage = {
      ...existing,
      ...usage,
    };
    this.apiUsage.set(service, updated);
    return updated;
  }

  async incrementApiCall(service: string, endpoint: string): Promise<void> {
    const existing = this.apiUsage.get(service);
    if (existing && existing.callsCount !== null) {
      existing.callsCount++;
      this.apiUsage.set(service, existing);
    }
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeApiUsage();
  }

  private async initializeApiUsage() {
    // Check if API usage records exist, if not create them
    const twitterUsage = await this.getApiUsage('twitter');
    if (!twitterUsage) {
      await this.updateApiUsage('twitter', {
        endpoint: 'general',
        callsCount: 0,
        dailyLimit: 1000,
      });
    }

    const llmUsage = await this.getApiUsage('llm');
    if (!llmUsage) {
      await this.updateApiUsage('llm', {
        endpoint: 'general',
        callsCount: 0,
        dailyLimit: 100,
      });
    }
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllBots(): Promise<Bot[]> {
    return await db.select().from(bots).orderBy(desc(bots.createdAt));
  }

  async getBot(id: number): Promise<Bot | undefined> {
    const [bot] = await db.select().from(bots).where(eq(bots.id, id));
    return bot || undefined;
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const [bot] = await db
      .insert(bots)
      .values(insertBot)
      .returning();
    return bot;
  }

  async updateBot(id: number, botUpdate: Partial<InsertBot>): Promise<Bot | undefined> {
    const [bot] = await db
      .update(bots)
      .set({
        ...botUpdate,
        updatedAt: new Date(),
      })
      .where(eq(bots.id, id))
      .returning();
    return bot || undefined;
  }

  async deleteBot(id: number): Promise<boolean> {
    const result = await db.delete(bots).where(eq(bots.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getActivities(limit = 50, botId?: number): Promise<Activity[]> {
    const query = db.select().from(activities);
    
    if (botId) {
      query.where(eq(activities.botId, botId));
    }
    
    return await query
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getActivitiesByBot(botId: number, limit = 50): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.botId, botId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async getApiUsage(service: string): Promise<ApiUsage | undefined> {
    const [usage] = await db.select().from(apiUsage).where(eq(apiUsage.service, service));
    return usage || undefined;
  }

  async updateApiUsage(service: string, usage: Partial<InsertApiUsage>): Promise<ApiUsage> {
    const existing = await this.getApiUsage(service);
    
    if (!existing) {
      const [newUsage] = await db
        .insert(apiUsage)
        .values({
          service,
          endpoint: usage.endpoint || 'general',
          callsCount: usage.callsCount || 0,
          lastReset: usage.lastReset || new Date(),
          dailyLimit: usage.dailyLimit || 1000,
        })
        .returning();
      return newUsage;
    }
    
    const [updated] = await db
      .update(apiUsage)
      .set(usage)
      .where(eq(apiUsage.service, service))
      .returning();
    return updated;
  }

  async incrementApiCall(service: string, endpoint: string): Promise<void> {
    const existing = await this.getApiUsage(service);
    if (existing && existing.callsCount !== null) {
      await db
        .update(apiUsage)
        .set({ callsCount: existing.callsCount + 1 })
        .where(eq(apiUsage.service, service));
    }
  }
}

export const storage = new DatabaseStorage();
