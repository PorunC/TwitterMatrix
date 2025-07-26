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
    if (!bot.interactionTargets) {
      console.log(`Bot ${bot.name} has no interaction targets configured`);
      return;
    }

    // Parse interaction targets from JSON string
    let targetIds: string[] = [];
    try {
      targetIds = JSON.parse(bot.interactionTargets);
    } catch (error) {
      console.error(`Failed to parse interaction targets for bot ${bot.name}:`, error);
      return;
    }

    if (targetIds.length === 0) {
      console.log(`Bot ${bot.name} has empty interaction targets`);
      return;
    }

    // Get random target bot
    const targetBotId = targetIds[Math.floor(Math.random() * targetIds.length)];
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
      friendly: ['like', 'reply', 'retweet', 'follow'],
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
            metadata: JSON.stringify({ interactionType: 'like', targetBot: targetBot.name })
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
            metadata: JSON.stringify({ interactionType: 'reply', targetBot: targetBot.name })
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
            metadata: JSON.stringify({ interactionType: 'retweet', targetBot: targetBot.name })
          });
          break;

        case 'follow':
          // Get target bot's Twitter user ID first
          const targetUserInfo = await this.getTargetBotUserId(targetBot);
          if (targetUserInfo) {
            await this.twitterService.followUser(targetUserInfo.id_str, bot.id);
            await storage.createActivity({
              botId: bot.id,
              action: 'bot_interaction',
              content: `Followed ${targetBot.name} (@${targetBot.twitterUsername})`,
              targetUser: targetUserInfo.id_str,
              targetBotId: targetBot.id,
              status: 'success',
              metadata: JSON.stringify({ interactionType: 'follow', targetBot: targetBot.name, targetUsername: targetBot.twitterUsername })
            });
          }
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
        metadata: JSON.stringify({ interactionType, targetBot: targetBot.name })
      });
    }
  }

  private async getTargetBotUserId(targetBot: Bot): Promise<any> {
    try {
      if (!targetBot.twitterUsername) {
        console.log(`Target bot ${targetBot.name} has no Twitter username`);
        return null;
      }
      
      const userInfo = await this.twitterService.getUserByScreenName(targetBot.twitterUsername);
      return userInfo?.data?.user?.result?.legacy || null;
    } catch (error) {
      console.error(`Failed to get user info for ${targetBot.twitterUsername}:`, error);
      return null;
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
        likes: botInteractions.filter(a => {
          try {
            const metadata = a.metadata ? JSON.parse(a.metadata) : {};
            return metadata.interactionType === 'like';
          } catch { return false; }
        }).length,
        replies: botInteractions.filter(a => {
          try {
            const metadata = a.metadata ? JSON.parse(a.metadata) : {};
            return metadata.interactionType === 'reply';
          } catch { return false; }
        }).length,
        retweets: botInteractions.filter(a => {
          try {
            const metadata = a.metadata ? JSON.parse(a.metadata) : {};
            return metadata.interactionType === 'retweet';
          } catch { return false; }
        }).length,
        follows: botInteractions.filter(a => {
          try {
            const metadata = a.metadata ? JSON.parse(a.metadata) : {};
            return metadata.interactionType === 'follow';
          } catch { return false; }
        }).length
      }
    };

    return stats;
  }

  // 批量启动所有机器人的互动
  async startAllBotInteractions() {
    try {
      const bots = await storage.getAllBots();
      const activeBots = bots.filter(bot => bot.isActive && bot.enableInteraction);
      
      console.log(`Starting interactions for ${activeBots.length} active bots`);
      
      for (const bot of activeBots) {
        await this.startBotInteractions(bot.id);
      }
      
      return { started: activeBots.length, message: `Started interactions for ${activeBots.length} bots` };
    } catch (error) {
      console.error('Failed to start all bot interactions:', error);
      throw error;
    }
  }

  // 智能互动：基于话题相关性选择目标
  async performTopicBasedInteraction(botId: number) {
    try {
      const bot = await storage.getBot(botId);
      if (!bot || !bot.enableInteraction) return;

      // 获取机器人的话题
      const botTopics = JSON.parse(bot.topics || '[]');
      if (botTopics.length === 0) return;

      // 搜索相关话题的推文
      const randomTopic = botTopics[Math.floor(Math.random() * botTopics.length)];
      const searchResults = await this.twitterService.searchTweets(randomTopic, 10);
      
      if (!searchResults?.data?.search_by_raw_query?.search_timeline?.timeline?.instructions) {
        return;
      }

      // 从搜索结果中选择推文进行互动
      const tweets = this.extractTweetsFromSearch(searchResults);
      if (tweets.length === 0) return;

      const randomTweet = tweets[Math.floor(Math.random() * tweets.length)];
      const interactionType = this.chooseInteractionType(bot.interactionBehavior || 'friendly');

      await this.performTopicInteraction(bot, randomTweet, interactionType, randomTopic);
    } catch (error) {
      console.error(`Topic-based interaction failed for bot ${botId}:`, error);
    }
  }

  private extractTweetsFromSearch(searchResults: any): any[] {
    try {
      const instructions = searchResults.data.search_by_raw_query.search_timeline.timeline.instructions;
      const entries = instructions.find((inst: any) => inst.type === 'TimelineAddEntries')?.entries || [];
      
      return entries
        .filter((entry: any) => entry.entryId?.startsWith('tweet-'))
        .map((entry: any) => entry.content?.itemContent?.tweet_results?.result)
        .filter((tweet: any) => tweet && tweet.legacy);
    } catch (error) {
      console.error('Failed to extract tweets from search results:', error);
      return [];
    }
  }

  private async performTopicInteraction(bot: Bot, tweet: any, interactionType: string, topic: string) {
    try {
      const tweetId = tweet.rest_id || tweet.legacy?.id_str;
      if (!tweetId) return;

      switch (interactionType) {
        case 'like':
          await this.twitterService.likeTweet(tweetId, bot.id);
          break;
        case 'reply':
          const replyContent = await this.generateTopicReply(bot, tweet.legacy?.full_text || '', topic);
          await this.twitterService.replyToTweet(tweetId, replyContent, bot.id);
          break;
        case 'retweet':
          await this.twitterService.retweetTweet(tweetId, bot.id);
          break;
      }

      await storage.createActivity({
        botId: bot.id,
        action: 'topic_interaction',
        content: `${interactionType} on topic: ${topic}`,
        tweetId,
        status: 'success',
        metadata: JSON.stringify({ interactionType, topic, tweetContent: tweet.legacy?.full_text })
      });

      console.log(`Bot ${bot.name} performed ${interactionType} on topic "${topic}"`);
    } catch (error: any) {
      await storage.createActivity({
        botId: bot.id,
        action: 'topic_interaction',
        content: `Failed to ${interactionType} on topic: ${topic}`,
        tweetId: tweet.rest_id || tweet.legacy?.id_str,
        status: 'failed',
        errorMessage: error.message,
        metadata: JSON.stringify({ interactionType, topic })
      });
    }
  }

  private async generateTopicReply(bot: Bot, originalContent: string, topic: string): Promise<string> {
    const prompt = `你是${bot.name}，针对话题"${topic}"，回复这条推文："${originalContent}"。回复应该与话题相关且具有见解。个性特征：${bot.personality || 'professional'}`;
    return await this.llmService.generateTweet(prompt, bot.personality || 'professional');
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