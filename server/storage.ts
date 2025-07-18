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
    if (existing) {
      existing.callsCount++;
      this.apiUsage.set(service, existing);
    }
  }
}

export const storage = new MemStorage();
