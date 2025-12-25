import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Eye,
} from "lucide-react";

type AlertType = "opportunity" | "risk" | "profit" | "loss" | "pattern";

interface TradeAlert {
  id?: number;
  symbol: string;
  alertType: AlertType;
  strategy: string;
  confidence: number;
  message: string;
  price: string;
  isRead: boolean;
  createdAt: Date;
}

const alertTypeConfig: Record<AlertType, { icon: typeof Bell; color: string; bgColor: string }> = {
  opportunity: { icon: Zap, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  risk: { icon: AlertTriangle, color: "text-orange-400", bgColor: "bg-orange-500/20" },
  profit: { icon: TrendingUp, color: "text-green-400", bgColor: "bg-green-500/20" },
  loss: { icon: TrendingDown, color: "text-red-400", bgColor: "bg-red-500/20" },
  pattern: { icon: Eye, color: "text-purple-400", bgColor: "bg-purple-500/20" },
};

export function TradeAlertsPanel() {
  const [filter, setFilter] = useState<AlertType | "all">("all");
  
  const { data: alertsData, refetch: refetchAlerts } = trpc.alerts.getRecent.useQuery(
    { limit: 50 },
    { refetchInterval: 5000 }
  );
  
  const { data: unreadData, refetch: refetchUnread } = trpc.alerts.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 5000 }
  );
  
  const { data: statsData } = trpc.alerts.getStats.useQuery(
    undefined,
    { refetchInterval: 10000 }
  );
  
  const markAsReadMutation = trpc.alerts.markAsRead.useMutation({
    onSuccess: () => {
      refetchAlerts();
      refetchUnread();
    },
  });
  
  const markAllAsReadMutation = trpc.alerts.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchAlerts();
      refetchUnread();
    },
  });
  
  const alerts = alertsData?.alerts || [];
  const unreadCount = unreadData?.count || 0;
  const stats = statsData;
  
  const filteredAlerts = filter === "all" 
    ? alerts 
    : alerts.filter(a => a.alertType === filter);
  
  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };
  
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {unreadCount > 0 ? (
                <BellRing className="w-5 h-5 text-yellow-400 animate-pulse" />
              ) : (
                <Bell className="w-5 h-5 text-zinc-400" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <CardTitle className="text-lg">Trade Alerts</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-zinc-400 hover:text-white"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        {/* Filter tabs */}
        <div className="flex gap-1 mt-3 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs"
          >
            All ({alerts.length})
          </Button>
          {(Object.keys(alertTypeConfig) as AlertType[]).map(type => {
            const config = alertTypeConfig[type];
            const count = stats?.byType?.[type] || 0;
            return (
              <Button
                key={type}
                variant={filter === type ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(type)}
                className={`text-xs ${filter !== type ? config.color : ""}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
              </Button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No alerts yet</p>
            <p className="text-xs mt-1">Alerts will appear here when trading</p>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => {
            const config = alertTypeConfig[alert.alertType];
            const Icon = config.icon;
            
            return (
              <div
                key={alert.id || index}
                className={`p-3 rounded-lg border transition-all ${
                  alert.isRead 
                    ? "bg-zinc-900/30 border-zinc-800/50 opacity-70" 
                    : `${config.bgColor} border-zinc-700`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-xs ${config.color} border-current/30`}>
                        {alert.symbol}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-600">
                        {alert.strategy}
                      </Badge>
                      {alert.confidence >= 80 && (
                        <Badge className="text-xs bg-green-500/20 text-green-400 border-0">
                          {alert.confidence}% conf
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-zinc-300 line-clamp-2">{alert.message}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-zinc-500">
                        {formatTime(alert.createdAt)} • ${alert.price}
                      </span>
                      
                      {!alert.isRead && alert.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate({ alertId: alert.id! })}
                          className="h-6 px-2 text-xs text-zinc-400 hover:text-white"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
      
      {/* Stats footer */}
      {stats && (
        <div className="px-4 pb-3 pt-2 border-t border-zinc-800">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Last 24h: {stats.last24h} alerts</span>
            <span>Total: {stats.total}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
