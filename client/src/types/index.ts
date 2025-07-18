export interface Bot {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  twitterUsername: string | null;
  topics: string[] | null;
  personality: string | null;
  postFrequency: number;
  lastTweetTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: number;
  botId: number | null;
  action: string;
  content: string | null;
  tweetId: string | null;
  targetUser: string | null;
  status: string;
  errorMessage: string | null;
  metadata: any;
  createdAt: Date;
}

export interface ApiUsage {
  id: number;
  service: string;
  endpoint: string | null;
  callsCount: number;
  lastReset: Date;
  dailyLimit: number | null;
  createdAt: Date;
}

export interface Stats {
  activeBots: number;
  totalTweets: number;
  totalApiCalls: number;
  twitterApiCalls: number;
  twitterApiLimit: number;
  llmApiCalls: number;
  llmApiLimit: number;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
