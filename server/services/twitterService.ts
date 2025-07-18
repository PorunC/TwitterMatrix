import axios from 'axios';
import { storage } from '../storage';

const APIDANCE_BASE_URL = 'https://api.apidance.pro';

export class TwitterService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.APIDANCE_API_KEY || process.env.TWITTER_API_KEY || '';
  }

  private async makeRequest(endpoint: string, method = 'GET', data?: any) {
    try {
      await storage.incrementApiCall('twitter', endpoint);
      
      const response = await axios({
        method,
        url: `${APIDANCE_BASE_URL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data,
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Twitter API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  async postTweet(content: string, botId: number) {
    try {
      const result = await this.makeRequest('/graphql/CreateTweet', 'POST', {
        text: content,
      });
      
      await storage.createActivity({
        botId,
        action: 'tweet',
        content,
        status: 'success',
        metadata: result,
      });
      
      return result;
    } catch (error: any) {
      await storage.createActivity({
        botId,
        action: 'tweet',
        content,
        status: 'failed',
        errorMessage: error.message,
      });
      throw error;
    }
  }

  async likeTweet(tweetId: string, botId: number) {
    try {
      const result = await this.makeRequest('/graphql/FavoriteTweet', 'POST', {
        tweet_id: tweetId,
      });
      
      await storage.createActivity({
        botId,
        action: 'like',
        tweetId,
        status: 'success',
        metadata: result,
      });
      
      return result;
    } catch (error: any) {
      await storage.createActivity({
        botId,
        action: 'like',
        tweetId,
        status: 'failed',
        errorMessage: error.message,
      });
      throw error;
    }
  }

  async replyToTweet(tweetId: string, content: string, botId: number) {
    try {
      const result = await this.makeRequest('/graphql/CreateTweet', 'POST', {
        text: content,
        reply: {
          in_reply_to_tweet_id: tweetId,
        },
      });
      
      await storage.createActivity({
        botId,
        action: 'reply',
        content,
        tweetId,
        status: 'success',
        metadata: result,
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
      });
      throw error;
    }
  }

  async retweetTweet(tweetId: string, botId: number) {
    try {
      const result = await this.makeRequest('/graphql/CreateRetweet', 'POST', {
        tweet_id: tweetId,
      });
      
      await storage.createActivity({
        botId,
        action: 'retweet',
        tweetId,
        status: 'success',
        metadata: result,
      });
      
      return result;
    } catch (error: any) {
      await storage.createActivity({
        botId,
        action: 'retweet',
        tweetId,
        status: 'failed',
        errorMessage: error.message,
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

  async checkApiLimits() {
    try {
      const result = await this.makeRequest('/check-remaining-calls');
      return result;
    } catch (error: any) {
      throw error;
    }
  }
}
