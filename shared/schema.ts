import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const bots = pgTable("bots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  twitterUsername: text("twitter_username"),
  twitterAuthToken: text("twitter_auth_token"), // Store Twitter auth token
  topics: text("topics").array(),
  personality: text("personality"),
  postFrequency: integer("post_frequency").default(60), // minutes
  lastTweetTime: timestamp("last_tweet_time"),
  // Bot interaction settings
  enableInteraction: boolean("enable_interaction").default(true),
  interactionFrequency: integer("interaction_frequency").default(30), // minutes
  interactionTargets: text("interaction_targets").array(), // Bot IDs to interact with
  interactionBehavior: text("interaction_behavior").default("friendly"), // friendly, aggressive, neutral
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").references(() => bots.id),
  action: text("action").notNull(), // 'tweet', 'like', 'reply', 'retweet', 'bot_interaction'
  content: text("content"),
  tweetId: text("tweet_id"),
  targetUser: text("target_user"),
  targetBotId: integer("target_bot_id").references(() => bots.id), // For bot-to-bot interactions
  status: text("status").notNull(), // 'success', 'failed', 'pending'
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiUsage = pgTable("api_usage", {
  id: serial("id").primaryKey(),
  service: text("service").notNull(), // 'twitter', 'llm'
  endpoint: text("endpoint"),
  callsCount: integer("calls_count").default(0),
  lastReset: timestamp("last_reset").defaultNow(),
  dailyLimit: integer("daily_limit"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertApiUsageSchema = createInsertSchema(apiUsage).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Relations
export const botsRelations = relations(bots, ({ many }) => ({
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  bot: one(bots, {
    fields: [activities.botId],
    references: [bots.id],
  }),
}));

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Bot = typeof bots.$inferSelect;
export type InsertBot = z.infer<typeof insertBotSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type ApiUsage = typeof apiUsage.$inferSelect;
export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;
