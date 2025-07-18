import { storage } from '../storage';
import { TwitterService } from './twitterService';
import { LLMService } from './llmService';
import { Bot } from '@shared/schema';

export class BotService {
  private twitterService: TwitterService;
  private llmService: LLMService;
  private intervals: Map<number, NodeJS.Timeout>;

  constructor() {
    this.twitterService = new TwitterService();
    this.llmService = new LLMService();
    this.intervals = new Map();
  }

  async startBot(botId: number) {
    const bot = await storage.getBot(botId);
    if (!bot || !bot.isActive) {
      throw new Error('Bot not found or inactive');
    }

    // Clear existing interval if any
    this.stopBot(botId);

    // Start the bot's autonomous behavior
    const interval = setInterval(async () => {
      await this.executeBotActions(bot);
    }, bot.postFrequency * 60 * 1000); // Convert minutes to milliseconds

    this.intervals.set(botId, interval);
    
    // Execute initial actions
    await this.executeBotActions(bot);
  }

  stopBot(botId: number) {
    const interval = this.intervals.get(botId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(botId);
    }
  }

  async pauseBot(botId: number) {
    await storage.updateBot(botId, { isActive: false });
    this.stopBot(botId);
  }

  async resumeBot(botId: number) {
    await storage.updateBot(botId, { isActive: true });
    await this.startBot(botId);
  }

  private async executeBotActions(bot: Bot) {
    try {
      // 1. Check if it's time to post a new tweet
      const shouldPost = await this.shouldPostNewTweet(bot);
      if (shouldPost) {
        await this.generateAndPostTweet(bot);
      }

      // 2. Monitor timeline and engage with relevant content
      await this.monitorAndEngage(bot);

      // 3. Respond to mentions (if any)
      await this.respondToMentions(bot);

    } catch (error: any) {
      console.error(`Bot ${bot.id} error:`, error.message);
      await storage.createActivity({
        botId: bot.id,
        action: 'error',
        content: `Bot execution failed: ${error.message}`,
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  private async shouldPostNewTweet(bot: Bot): boolean {
    if (!bot.lastTweetTime) return true;
    
    const now = new Date();
    const lastTweet = new Date(bot.lastTweetTime);
    const minutesSinceLastTweet = (now.getTime() - lastTweet.getTime()) / (1000 * 60);
    
    return minutesSinceLastTweet >= bot.postFrequency;
  }

  private async generateAndPostTweet(bot: Bot) {
    try {
      const topics = bot.topics || ['general'];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      const tweetContent = await this.llmService.generateTweet(
        randomTopic,
        bot.personality || 'professional'
      );

      await this.twitterService.postTweet(tweetContent, bot.id);
      
      // Update last tweet time
      await storage.updateBot(bot.id, { lastTweetTime: new Date() });
      
    } catch (error: any) {
      console.error(`Failed to generate tweet for bot ${bot.id}:`, error.message);
    }
  }

  private async monitorAndEngage(bot: Bot) {
    try {
      const topics = bot.topics || ['general'];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      // Search for relevant tweets
      const searchResults = await this.twitterService.searchTweets(randomTopic, 5);
      
      if (searchResults?.tweets) {
        for (const tweet of searchResults.tweets.slice(0, 2)) { // Limit to 2 tweets
          // Analyze tweet relevance
          const analysis = await this.llmService.analyzeTweet(tweet.text);
          
          if (analysis.engagement_score > 70) {
            // High engagement potential - like and maybe reply
            await this.twitterService.likeTweet(tweet.id, bot.id);
            
            if (Math.random() > 0.7) { // 30% chance to reply
              const replyContent = await this.llmService.generateReply(
                tweet.text,
                bot.personality || 'professional'
              );
              await this.twitterService.replyToTweet(tweet.id, replyContent, bot.id);
            }
          } else if (analysis.engagement_score > 50) {
            // Medium engagement - just like
            await this.twitterService.likeTweet(tweet.id, bot.id);
          }
        }
      }
    } catch (error: any) {
      console.error(`Failed to monitor and engage for bot ${bot.id}:`, error.message);
    }
  }

  private async respondToMentions(bot: Bot) {
    try {
      // This would require getting mentions from Twitter API
      // For now, we'll implement a placeholder that could be extended
      console.log(`Checking mentions for bot ${bot.id}`);
    } catch (error: any) {
      console.error(`Failed to check mentions for bot ${bot.id}:`, error.message);
    }
  }

  async initializeAllBots() {
    const bots = await storage.getAllBots();
    for (const bot of bots) {
      if (bot.isActive) {
        await this.startBot(bot.id);
      }
    }
  }

  async stopAllBots() {
    for (const [botId] of this.intervals) {
      this.stopBot(botId);
    }
  }
}

export const botService = new BotService();
