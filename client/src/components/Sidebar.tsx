import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Bot, 
  Cog, 
  Edit, 
  Home, 
  List, 
  Settings,
  Users
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Bot Management", href: "/bots", icon: Bot },
  { name: "Content Generation", href: "/content", icon: Edit },
  { name: "Bot Interactions", href: "/interactions", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "API Settings", href: "/settings", icon: Settings },
  { name: "Activity Logs", href: "/logs", icon: List },
];

interface SidebarProps {
  apiStatus: {
    twitter: { calls: number; limit: number };
    llm: { calls: number; limit: number };
  };
}

export function Sidebar({ apiStatus }: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-5 border-b border-slate-700">
          <Bot className="text-blue-500 h-6 w-6 mr-3" />
          <h1 className="text-lg font-semibold text-white">Twitter Bot Matrix</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-white bg-blue-600"
                    : "text-gray-300 hover:text-white hover:bg-slate-700"
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* API Status */}
        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-300">API Status</span>
              <span className="text-xs text-green-400">Active</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Twitter API</span>
                <span className={cn(
                  "font-medium",
                  apiStatus.twitter.calls / apiStatus.twitter.limit > 0.8
                    ? "text-red-400"
                    : apiStatus.twitter.calls / apiStatus.twitter.limit > 0.6
                    ? "text-yellow-400"
                    : "text-green-400"
                )}>
                  {apiStatus.twitter.calls}/{apiStatus.twitter.limit}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">LLM API</span>
                <span className={cn(
                  "font-medium",
                  apiStatus.llm.calls / apiStatus.llm.limit > 0.8
                    ? "text-red-400"
                    : apiStatus.llm.calls / apiStatus.llm.limit > 0.6
                    ? "text-yellow-400"
                    : "text-green-400"
                )}>
                  {apiStatus.llm.calls}/{apiStatus.llm.limit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
