import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const bots = sqliteTable("bots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  twitterUsername: text("twitter_username"),
  twitterAuthToken: text("twitter_auth_token"), // Store Twitter auth token
  topics: text("topics"), // JSON string array
  personality: text("personality"),
  postFrequency: integer("post_frequency").default(60), // minutes
  lastTweetTime: integer("last_tweet_time", { mode: "timestamp" }),
  // Bot interaction settings
  enableInteraction: integer("enable_interaction", { mode: "boolean" }).default(true),
  interactionFrequency: integer("interaction_frequency").default(30), // minutes
  interactionTargets: text("interaction_targets"), // JSON string array
  interactionBehavior: text("interaction_behavior").default("friendly"), // friendly, aggressive, neutral
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  botId: integer("bot_id").references(() => bots.id),
  action: text("action").notNull(), // 'tweet', 'like', 'reply', 'retweet', 'bot_interaction'
  content: text("content"),
  tweetId: text("tweet_id"),
  targetUser: text("target_user"),
  targetBotId: integer("target_bot_id").references(() => bots.id), // For bot-to-bot interactions
  status: text("status").notNull(), // 'success', 'failed', 'pending'
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const apiUsage = sqliteTable("api_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  service: text("service").notNull(), // 'twitter', 'llm'
  endpoint: text("endpoint"),
  callsCount: integer("calls_count").default(0),
  lastReset: integer("last_reset", { mode: "timestamp" }).defaultNow(),
  dailyLimit: integer("daily_limit"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
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
