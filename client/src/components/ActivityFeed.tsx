import { Activity } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Twitter, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'tweet':
        return <Twitter className="h-4 w-4 text-blue-500" />;
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'reply':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'retweet':
        return <Repeat2 className="h-4 w-4 text-purple-500" />;
      default:
        return <Twitter className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'tweet':
        return 'bg-blue-600';
      case 'like':
        return 'bg-red-600';
      case 'reply':
        return 'bg-green-600';
      case 'retweet':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${getActionColor(activity.action)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">
                    Bot {activity.botId} {activity.action === 'tweet' ? 'posted' : activity.action === 'like' ? 'liked' : activity.action === 'reply' ? 'replied to' : 'retweeted'} 
                    {activity.content && ` "${activity.content.substring(0, 50)}${activity.content.length > 50 ? '...' : ''}"`}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                    <Badge 
                      variant={activity.status === 'success' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
