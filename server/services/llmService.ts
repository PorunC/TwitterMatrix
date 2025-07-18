import axios from 'axios';
import { storage } from '../storage';

export class LLMService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BIANXIE_API_KEY || process.env.LLM_API_KEY || '';
    this.baseUrl = process.env.BIANXIE_BASE_URL || process.env.LLM_BASE_URL || 'https://api.bianxie.ai/v1';
  }

  private async makeRequest(endpoint: string, data: any) {
    try {
      await storage.incrementApiCall('llm', endpoint);
      
      const response = await axios.post(`${this.baseUrl}${endpoint}`, data, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(`LLM API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  async generateTweet(topic: string, personality: string = 'professional', context?: string) {
    const prompt = this.buildTweetPrompt(topic, personality, context);
    
    try {
      const result = await this.makeRequest('/chat/completions', {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 280,
      });
      
      return result.choices[0]?.message?.content || '';
    } catch (error: any) {
      throw error;
    }
  }

  async generateReply(originalTweet: string, personality: string = 'professional', context?: string) {
    const prompt = this.buildReplyPrompt(originalTweet, personality, context);
    
    try {
      const result = await this.makeRequest('/chat/completions', {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 280,
      });
      
      return result.choices[0]?.message?.content || '';
    } catch (error: any) {
      throw error;
    }
  }

  async analyzeTweet(tweetContent: string) {
    const prompt = `Analyze this tweet for sentiment, topic, and engagement potential. Return a JSON object with sentiment (positive/negative/neutral), topics (array), and engagement_score (0-100):

Tweet: "${tweetContent}"

Return only the JSON object.`;
    
    try {
      const result = await this.makeRequest('/chat/completions', {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      });
      
      const analysis = JSON.parse(result.choices[0]?.message?.content || '{}');
      return analysis;
    } catch (error: any) {
      throw error;
    }
  }

  private buildTweetPrompt(topic: string, personality: string, context?: string): string {
    return `Generate a tweet about "${topic}" with a ${personality} tone. 
    ${context ? `Additional context: ${context}` : ''}
    
    Requirements:
    - Keep it under 280 characters
    - Make it engaging and relevant
    - Include relevant hashtags if appropriate
    - Match the ${personality} personality
    - Don't use quotation marks around the tweet
    
    Return only the tweet text.`;
  }

  private buildReplyPrompt(originalTweet: string, personality: string, context?: string): string {
    return `Generate a thoughtful reply to this tweet with a ${personality} tone:
    
    Original Tweet: "${originalTweet}"
    ${context ? `Additional context: ${context}` : ''}
    
    Requirements:
    - Keep it under 280 characters
    - Be relevant and add value to the conversation
    - Match the ${personality} personality
    - Don't use quotation marks around the reply
    
    Return only the reply text.`;
  }
}
