import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "../components/StatsCard";
import { ActivityFeed } from "../components/ActivityFeed";
import { Bot, Twitter, Heart, TrendingUp } from "lucide-react";
import { Activity, Stats } from "../types";

export default function Analytics() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Calculate engagement metrics
  const successfulTweets = activities.filter(a => a.action === 'tweet' && a.status === 'success').length;
  const failedTweets = activities.filter(a => a.action === 'tweet' && a.status === 'failed').length;
  const successRate = successfulTweets + failedTweets > 0 ? (successfulTweets / (successfulTweets + failedTweets)) * 100 : 0;

  const likes = activities.filter(a => a.action === 'like').length;
  const replies = activities.filter(a => a.action === 'reply').length;
  const retweets = activities.filter(a => a.action === 'retweet').length;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white">Analytics</h2>
        <p className="text-sm text-gray-400">Monitor your bot performance and engagement metrics</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Active Bots"
          value={stats?.activeBots || 0}
          icon={Bot}
          iconColor="bg-blue-600"
        />
        <StatsCard
          title="Total Tweets"
          value={stats?.totalTweets || 0}
          icon={Twitter}
          iconColor="bg-emerald-600"
        />
        <StatsCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          icon={TrendingUp}
          iconColor="bg-green-600"
        />
        <StatsCard
          title="Engagement Actions"
          value={likes + replies + retweets}
          icon={Heart}
          iconColor="bg-purple-600"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Successful Tweets</span>
                <span className="text-green-400 font-semibold">{successfulTweets}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Failed Tweets</span>
                <span className="text-red-400 font-semibold">{failedTweets}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Likes Given</span>
                <span className="text-blue-400 font-semibold">{likes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Replies Sent</span>
                <span className="text-purple-400 font-semibold">{replies}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Retweets</span>
                <span className="text-emerald-400 font-semibold">{retweets}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">API Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Twitter API</span>
                  <span className="text-gray-400">
                    {stats?.twitterApiCalls || 0}/{stats?.twitterApiLimit || 1000}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${((stats?.twitterApiCalls || 0) / (stats?.twitterApiLimit || 1000)) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">LLM API</span>
                  <span className="text-gray-400">
                    {stats?.llmApiCalls || 0}/{stats?.llmApiLimit || 100}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${((stats?.llmApiCalls || 0) / (stats?.llmApiLimit || 100)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <div className="mt-8">
        <ActivityFeed activities={activities.slice(0, 20)} />
      </div>
    </div>
  );
}
