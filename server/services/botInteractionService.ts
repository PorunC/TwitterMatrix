import { storage } from '../storage';
import { TwitterService } from './twitterService';
import { LLMService } from './llmService';
import type { Bot } from '@shared/schema';

export class BotInteractionService {
  private twitterService: TwitterService;
  private llmService: LLMService;
  private activeInteractions: Map<number, NodeJS.Timeout> = new Map();

  constructor() {
    this.twitterService = new TwitterService();
    this.llmService = new LLMService();
  }

  async startBotInteractions(botId: number) {
    const bot = await storage.getBot(botId);
    if (!bot || !bot.enableInteraction) return;

    this.stopBotInteractions(botId);

    const intervalId = setInterval(async () => {
      try {
        await this.performBotInteraction(bot);
      } catch (error) {
        console.error(`Bot interaction error for bot ${botId}:`, error);
      }
    }, (bot.interactionFrequency || 30) * 60 * 1000);

    this.activeInteractions.set(botId, intervalId);
    console.log(`Started interactions for bot ${botId}`);
  }

  stopBotInteractions(botId: number) {
    const intervalId = this.activeInteractions.get(botId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeInteractions.delete(botId);
      console.log(`Stopped interactions for bot ${botId}`);
    }
  }

  private async performBotInteraction(bot: Bot) {
    if (!bot.interactionTargets || bot.interactionTargets.length === 0) {
      return;
    }

    // Get random target bot
    const targetBotId = bot.interactionTargets[Math.floor(Math.random() * bot.interactionTargets.length)];
    const targetBot = await storage.getBot(parseInt(targetBotId));
    
    if (!targetBot) return;

    // Get target bot's recent tweets
    const targetActivities = await storage.getActivitiesByBot(targetBot.id, 5);
    const recentTweets = targetActivities.filter(a => a.action === 'tweet' && a.status === 'success');
    
    if (recentTweets.length === 0) return;

    // Pick a random tweet to interact with
    const randomTweet = recentTweets[Math.floor(Math.random() * recentTweets.length)];
    const interactionType = this.chooseInteractionType(bot.interactionBehavior || 'friendly');

    try {
      await this.executeInteraction(bot, targetBot, randomTweet, interactionType);
    } catch (error) {
      console.error(`Failed to execute interaction:`, error);
    }
  }

  private chooseInteractionType(behavior: string): string {
    const interactions = {
      friendly: ['like', 'reply', 'retweet'],
      neutral: ['like', 'reply'],
      aggressive: ['reply'],
      analytical: ['reply', 'like']
    };

    const availableTypes = interactions[behavior as keyof typeof interactions] || interactions.friendly;
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }

  private async executeInteraction(bot: Bot, targetBot: Bot, tweet: any, interactionType: string) {
    const tweetId = tweet.metadata?.id_str || tweet.tweetId;
    if (!tweetId) return;

    try {
      switch (interactionType) {
        case 'like':
          await this.twitterService.likeTweet(tweetId, bot.id);
          await storage.createActivity({
            botId: bot.id,
            action: 'bot_interaction',
            content: `Liked tweet from ${targetBot.name}`,
            tweetId,
            targetBotId: targetBot.id,
            status: 'success',
            metadata: { interactionType: 'like', targetBot: targetBot.name }
          });
          break;

        case 'reply':
          const replyContent = await this.generateReply(bot, targetBot, tweet.content);
          await this.twitterService.replyToTweet(tweetId, replyContent, bot.id);
          await storage.createActivity({
            botId: bot.id,
            action: 'bot_interaction',
            content: replyContent,
            tweetId,
            targetBotId: targetBot.id,
            status: 'success',
            metadata: { interactionType: 'reply', targetBot: targetBot.name }
          });
          break;

        case 'retweet':
          await this.twitterService.retweetTweet(tweetId, bot.id);
          await storage.createActivity({
            botId: bot.id,
            action: 'bot_interaction',
            content: `Retweeted from ${targetBot.name}`,
            tweetId,
            targetBotId: targetBot.id,
            status: 'success',
            metadata: { interactionType: 'retweet', targetBot: targetBot.name }
          });
          break;
      }

      console.log(`Bot ${bot.name} performed ${interactionType} on ${targetBot.name}'s tweet`);
    } catch (error: any) {
      await storage.createActivity({
        botId: bot.id,
        action: 'bot_interaction',
        content: `Failed to ${interactionType} tweet from ${targetBot.name}`,
        tweetId,
        targetBotId: targetBot.id,
        status: 'failed',
        errorMessage: error.message,
        metadata: { interactionType, targetBot: targetBot.name }
      });
    }
  }

  private async generateReply(bot: Bot, targetBot: Bot, originalContent: string): Promise<string> {
    const behaviorPrompts = {
      friendly: `你是${bot.name}，以友好的方式回复${targetBot.name}的推文："${originalContent}"。回复应该积极、支持性的。`,
      neutral: `你是${bot.name}，以中性客观的方式回复${targetBot.name}的推文："${originalContent}"。回复应该专业、平和。`,
      aggressive: `你是${bot.name}，以挑战性的方式回复${targetBot.name}的推文："${originalContent}"。回复应该有批判性但保持礼貌。`,
      analytical: `你是${bot.name}，以分析性的方式回复${targetBot.name}的推文："${originalContent}"。回复应该深入、有见地。`
    };

    const prompt = behaviorPrompts[bot.interactionBehavior as keyof typeof behaviorPrompts] || behaviorPrompts.friendly;
    return await this.llmService.generateTweet(prompt, bot.personality || 'professional');
  }

  async getBotInteractionStats(botId: number) {
    const interactions = await storage.getActivitiesByBot(botId, 100);
    const botInteractions = interactions.filter(a => a.action === 'bot_interaction');
    
    const stats = {
      totalInteractions: botInteractions.length,
      successfulInteractions: botInteractions.filter(a => a.status === 'success').length,
      failedInteractions: botInteractions.filter(a => a.status === 'failed').length,
      interactionsByType: {
        likes: botInteractions.filter(a => a.metadata?.interactionType === 'like').length,
        replies: botInteractions.filter(a => a.metadata?.interactionType === 'reply').length,
        retweets: botInteractions.filter(a => a.metadata?.interactionType === 'retweet').length
      }
    };

    return stats;
  }

  stopAllInteractions() {
    this.activeInteractions.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.activeInteractions.clear();
    console.log('Stopped all bot interactions');
  }
}

export const botInteractionService = new BotInteractionService();