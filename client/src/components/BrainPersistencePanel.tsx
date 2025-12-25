import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Database,
  Save,
  Download,
  RefreshCw,
  Clock,
  Brain,
  CheckCircle2,
  XCircle,
  Loader2,
  History,
  Zap,
} from "lucide-react";

export function BrainPersistencePanel() {
  const { data: statusData, refetch: refetchStatus } = trpc.brainPersistence.getStatus.useQuery(
    undefined,
    { refetchInterval: 10000 }
  );
  
  const { data: historyData, refetch: refetchHistory } = trpc.brainPersistence.getHistory.useQuery();
  
  const saveMutation = trpc.brainPersistence.save.useMutation({
    onSuccess: () => {
      refetchStatus();
      refetchHistory();
    },
  });
  
  const loadMutation = trpc.brainPersistence.load.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });
  
  const startAutoSaveMutation = trpc.brainPersistence.startAutoSave.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });
  
  const stopAutoSaveMutation = trpc.brainPersistence.stopAutoSave.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });
  
  const status = statusData;
  const history = historyData?.records || [];
  
  const formatTime = (date: Date | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    return d.toLocaleTimeString();
  };
  
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  };
  
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-lg">Brain Persistence</CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={status?.autoSaveEnabled 
              ? "text-green-400 border-green-400/50" 
              : "text-zinc-400 border-zinc-600"
            }
          >
            {status?.autoSaveEnabled ? "Auto-save ON" : "Auto-save OFF"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-400">Last Save</span>
            </div>
            <p className="text-sm font-medium">
              {formatTime(status?.lastSaveTime ? new Date(status.lastSaveTime) : null)}
            </p>
          </div>
          
          <div className="p-3 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Save className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-400">Total Saves</span>
            </div>
            <p className="text-sm font-medium">{status?.saveCount || 0}</p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Now
          </Button>
          
          <Button
            onClick={() => loadMutation.mutate()}
            disabled={loadMutation.isPending}
            variant="outline"
            className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
          >
            {loadMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Load
          </Button>
        </div>
        
        {/* Auto-save toggle */}
        <div className="flex gap-2">
          {status?.autoSaveEnabled ? (
            <Button
              onClick={() => stopAutoSaveMutation.mutate()}
              disabled={stopAutoSaveMutation.isPending}
              variant="outline"
              className="flex-1 border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
            >
              {stopAutoSaveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Stop Auto-save
            </Button>
          ) : (
            <Button
              onClick={() => startAutoSaveMutation.mutate()}
              disabled={startAutoSaveMutation.isPending}
              variant="outline"
              className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/20"
            >
              {startAutoSaveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Enable Auto-save
            </Button>
          )}
        </div>
        
        {/* Save/Load result feedback */}
        {saveMutation.isSuccess && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">{saveMutation.data.message}</span>
          </div>
        )}
        
        {loadMutation.isSuccess && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            loadMutation.data.success 
              ? "bg-green-500/10 border border-green-500/30" 
              : "bg-yellow-500/10 border border-yellow-500/30"
          }`}>
            {loadMutation.data.success ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-yellow-400" />
            )}
            <span className={`text-sm ${loadMutation.data.success ? "text-green-400" : "text-yellow-400"}`}>
              {loadMutation.data.message}
            </span>
          </div>
        )}
        
        {/* Brain history */}
        {history.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-400">Saved Brain States</span>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {history.map((record, index) => (
                <div
                  key={record.id}
                  className={`p-3 rounded-lg border ${
                    index === 0 
                      ? "bg-cyan-500/10 border-cyan-500/30" 
                      : "bg-zinc-800/50 border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium">v{record.version}</span>
                      {index === 0 && (
                        <Badge className="text-xs bg-cyan-500/20 text-cyan-400 border-0">
                          Latest
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatDate(record.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500">Cycles</span>
                      <p className="text-cyan-400">{record.totalCycles}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Trades</span>
                      <p>{record.totalTrades}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Win Rate</span>
                      <p className={record.winRate >= 50 ? "text-green-400" : "text-red-400"}>
                        {(record.winRate / 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Patterns</span>
                      <p className="text-purple-400">{record.patternsLearned}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Info footer */}
        <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-500">
          <p>Brain state is automatically saved every 5 minutes when auto-save is enabled.</p>
          <p className="mt-1">The AI will continue learning from where it left off after server restarts.</p>
        </div>
      </CardContent>
    </Card>
  );
}
