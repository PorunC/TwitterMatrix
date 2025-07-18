import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Filter } from "lucide-react";
import { Activity, Bot } from "../types";
import { formatDistanceToNow } from "date-fns";

export default function ActivityLogs() {
  const [filterAction, setFilterAction] = useState("all");
  const [filterBot, setFilterBot] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: bots = [] } = useQuery<Bot[]>({
    queryKey: ["/api/bots"],
  });

  const filteredActivities = activities.filter(activity => {
    const matchesAction = filterAction === "all" || activity.action === filterAction;
    const matchesBot = filterBot === "all" || activity.botId?.toString() === filterBot;
    const matchesSearch = !searchTerm || 
      activity.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesAction && matchesBot && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      case 'pending':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
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

  const exportLogs = () => {
    const csv = [
      ['Time', 'Bot', 'Action', 'Content', 'Status', 'Error'],
      ...filteredActivities.map(activity => [
        new Date(activity.createdAt).toLocaleString(),
        activity.botId?.toString() || 'Unknown',
        activity.action,
        activity.content || '',
        activity.status,
        activity.errorMessage || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white">Activity Logs</h2>
          <p className="text-sm text-gray-400">View and filter bot activity history</p>
        </div>
        <Button onClick={exportLogs} className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="tweet">Tweets</SelectItem>
                  <SelectItem value="like">Likes</SelectItem>
                  <SelectItem value="reply">Replies</SelectItem>
                  <SelectItem value="retweet">Retweets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bot</label>
              <Select value={filterBot} onValueChange={setFilterBot}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Bots</SelectItem>
                  {bots.map(bot => (
                    <SelectItem key={bot.id} value={bot.id.toString()}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white pl-10"
                  placeholder="Search content..."
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            Activity Log ({filteredActivities.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-700">
                  <th className="py-3 px-4 text-gray-300 font-medium">Time</th>
                  <th className="py-3 px-4 text-gray-300 font-medium">Bot</th>
                  <th className="py-3 px-4 text-gray-300 font-medium">Action</th>
                  <th className="py-3 px-4 text-gray-300 font-medium">Content</th>
                  <th className="py-3 px-4 text-gray-300 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No activities found
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity) => (
                    <tr key={activity.id} className="border-b border-slate-700">
                      <td className="py-3 px-4">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </td>
                      <td className="py-3 px-4">
                        {bots.find(bot => bot.id === activity.botId)?.name || `Bot ${activity.botId}`}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getActionColor(activity.action)} text-white`}>
                          {activity.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="truncate" title={activity.content || ''}>
                          {activity.content || '-'}
                        </div>
                        {activity.errorMessage && (
                          <div className="text-xs text-red-400 mt-1">
                            {activity.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getStatusColor(activity.status)} text-white`}>
                          {activity.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
