import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor: string;
}

export function StatsCard({ title, value, icon: Icon, trend, iconColor }: StatsCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-2xl font-semibold text-white mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${iconColor}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {trend && (
          <div className="mt-4">
            <span className={`text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
