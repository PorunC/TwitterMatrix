import axios from 'axios';
import { storage } from '../storage';

export class TwitterService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.APIDANCE_API_KEY || process.env.TWITTER_API_KEY || '';
    this.baseUrl = process.env.APIDANCE_BASE_URL || process.env.TWITTER_BASE_URL || 'https://api.apidance.pro';
  }

  private async makeRequest(endpoint: string, method = 'GET', data?: any, authToken?: string) {
    try {
      await storage.incrementApiCall('twitter', endpoint);
      
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'AuthToken': authToken || '',
        },
        data,
      });
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.msg || error.response?.data?.message || error.message;
      throw new Error(`Twitter API Error: ${errorMessage}`);
    }
  }

  async postTweet(content: string, botId: number) {
    try {
      // Get bot's auth token
      const bot = await storage.getBot(botId);
      if (!bot) {
        throw new Error('Bot not found');
      }
      
      const authToken = bot.twitterAuthToken;
      if (!authToken) {
        throw new Error('Bot does not have a Twitter auth token');
      }
      
      const result = await this.makeRequest('/graphql/CreateTweet', 'POST', {
        variables: {
          tweet_text: content,
        }
      }, authToken);
      
      await storage.createActivity({
        botId,
        action: 'tweet',
        content,
        status: 'success',
        metadata: JSON.stringify(result),
      });
      
      return result;
    } catch (error: any) {
      await storage.createActivity({
        botId,
        action: 'tweet',
        content,
        status: 'failed',
        errorMessage: error.message,
        metadata: null,
      });
      throw error;
    }
  }

  async likeTweet(tweetId: string, botId: number) {
    try {
      // Get bot's auth token
      const bot = await storage.getBot(botId);
      if (!bot) {
        throw new Error('Bot not found');
      }
      
      const authToken = bot.twitterAuthToken;
      if (!authToken) {
        throw new Error('Bot does not have a Twitter auth token');
      }
      
      const result = await this.makeRequest('/graphql/FavoriteTweet', 'POST', {
        variables: {
          tweet_id: tweetId,
        }
      }, authToken);
      
      await storage.createActivity({
        botId,
        action: 'like',
        tweetId,
        status: 'success',
        metadata: JSON.stringify(result),
      });
      
      return result;
    } catch (error: any) {
      await storage.createActivity({
        botId,
        action: 'like',
        tweetId,
        status: 'failed',
        errorMessage: error.message,
        metadata: null,
      });
      throw error;
    }
  }

  async replyToTweet(tweetId: string, content: string, botId: number) {
    try {
      // Get bot's auth token
      const bot = await storage.getBot(botId);
      if (!bot) {
        throw new Error('Bot not found');
      }
      
      const authToken = bot.twitterAuthToken;
      if (!authToken) {
        throw new Error('Bot does not have a Twitter auth token');
      }
      
      const result = await this.makeRequest('/graphql/CreateTweet', 'POST', {
        variables: {
          tweet_text: content,
          reply: {
            in_reply_to_tweet_id: tweetId,
          },
        }
      }, authToken);
      
      await storage.createActivity({
        botId,
        action: 'reply',
        content,
        tweetId,
        status: 'success',
        metadata: JSON.stringify(result),
      });
      
      return result;
    } catch (error: any) {
      await storage.createActivity({
        botId,
        action: 'reply',
        content,
        tweetId,
        status: 'failed',
        errorMessage: error.message,
        metadata: null,
      });
      throw error;
    }
  }

  async retweetTweet(tweetId: string, botId: number) {
    try {
      // Get bot's auth token
      const bot = await storage.getBot(botId);
      if (!bot) {
        throw new Error('Bot not found');
      }
      
      const authToken = bot.twitterAuthToken;
      if (!authToken) {
        throw new Error('Bot does not have a Twitter auth token');
      }
      
      const result = await this.makeRequest('/graphql/CreateRetweet', 'POST', {
        variables: {
          tweet_id: tweetId,
        }
      }, authToken);
      
      await storage.createActivity({
        botId,
        action: 'retweet',
        tweetId,
        status: 'success',
        metadata: JSON.stringify(result),
      });
      
      return result;
    } catch (error: any) {
      await storage.createActivity({
        botId,
        action: 'retweet',
        tweetId,
        status: 'failed',
        errorMessage: error.message,
        metadata: null,
      });
      throw error;
    }
  }

  async followUser(userId: string, botId: number) {
    try {
      // Get bot's auth token
      const bot = await storage.getBot(botId);
      if (!bot) {
        throw new Error('Bot not found');
      }
      
      const authToken = bot.twitterAuthToken;
      if (!authToken) {
        throw new Error('Bot does not have a Twitter auth token');
      }
      
      // Using the 1.1 API endpoint for following
      const result = await this.makeRequest('/1.1/friendships/create', 'POST', {
        user_id: userId,
        follow: true
      }, authToken);
      
      await storage.createActivity({
        botId,
        action: 'follow',
        targetUser: userId,
        status: 'success',
        metadata: JSON.stringify(result),
      });
      
      return result;
    } catch (error: any) {
      await storage.createActivity({
        botId,
        action: 'follow',
        targetUser: userId,
        status: 'failed',
        errorMessage: error.message,
        metadata: null,
      });
      throw error;
    }
  }

  async unfollowUser(userId: string, botId: number) {
    try {
      // Get bot's auth token
      const bot = await storage.getBot(botId);
      if (!bot) {
        throw new Error('Bot not found');
      }
      
      const authToken = bot.twitterAuthToken;
      if (!authToken) {
        throw new Error('Bot does not have a Twitter auth token');
      }
      
      // Using the 1.1 API endpoint for unfollowing
      const result = await this.makeRequest('/1.1/friendships/destroy', 'POST', {
        user_id: userId
      }, authToken);
      
      await storage.createActivity({
        botId,
        action: 'unfollow',
        targetUser: userId,
        status: 'success',
        metadata: JSON.stringify(result),
      });
      
      return result;
    } catch (error: any) {
      await storage.createActivity({
        botId,
        action: 'unfollow',
        targetUser: userId,
        status: 'failed',
        errorMessage: error.message,
        metadata: null,
      });
      throw error;
    }
  }

  async searchTweets(query: string, count = 10) {
    try {
      const result = await this.makeRequest('/graphql/SearchTimeline', 'POST', {
        rawQuery: query,
        count,
      });
      
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  async getHomeTimeline(count = 20) {
    try {
      const result = await this.makeRequest('/graphql/HomeLatestTimeline', 'POST', {
        count,
      });
      
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  async getUserTweets(username: string, count = 20) {
    try {
      const result = await this.makeRequest('/graphql/UserTweets', 'POST', {
        screen_name: username,
        count,
      });
      
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  async getUserByScreenName(screenName: string) {
    try {
      const result = await this.makeRequest('/graphql/UserByScreenName', 'POST', {
        screen_name: screenName
      });
      
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  async getTweetDetail(tweetId: string) {
    try {
      const result = await this.makeRequest('/graphql/TweetDetail', 'POST', {
        focalTweetId: tweetId
      });
      
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  async getFollowers(userId: string, count = 20) {
    try {
      const result = await this.makeRequest('/graphql/Followers', 'POST', {
        userId,
        count
      });
      
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  async getFollowing(userId: string, count = 20) {
    try {
      const result = await this.makeRequest('/graphql/Following', 'POST', {
        userId,
        count
      });
      
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  async checkApiLimits() {
    try {
      // Use the correct endpoint for checking remaining API calls
      const result = await this.makeRequest('/twitter-api/check-remaining-calls', 'GET');
      return result;
    } catch (error: any) {
      throw error;
    }
  }
}
