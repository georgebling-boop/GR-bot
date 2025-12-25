import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Bell, Mail, MessageSquare, CheckCircle, XCircle } from "lucide-react";

export function NotificationsDisplay() {
  const { data: stats } = trpc.notifications.getStats.useQuery();
  const { data: history } = trpc.notifications.getHistory.useQuery({ limit: 20 });

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-yellow-500" />
          Notification Activity
          {stats && (
            <Badge variant="outline" className="ml-auto text-xs">
              {stats.totalSent} total sent
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
              <Mail className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-blue-400">{stats.byChannel.email || 0}</div>
              <div className="text-xs text-zinc-500">Emails</div>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
              <MessageSquare className="h-5 w-5 text-green-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-green-400">{stats.byChannel.sms || 0}</div>
              <div className="text-xs text-zinc-500">SMS</div>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
              <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-emerald-400">{stats.successRate.toFixed(0)}%</div>
              <div className="text-xs text-zinc-500">Success Rate</div>
            </div>
          </div>
        )}

        {/* Recent Notifications */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-zinc-400">Recent Notifications</div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {history && history.logs.length > 0 ? (
              history.logs.map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-sm p-2 bg-zinc-800/50 rounded">
                  {log.status === "sent" ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <Badge variant="outline" className="text-xs">
                    {log.channel}
                  </Badge>
                  <span className="text-zinc-400 truncate flex-1">{log.recipient}</span>
                  <span className="text-zinc-600 text-xs">{new Date(log.sentAt).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-zinc-500 py-4">No notifications yet</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
