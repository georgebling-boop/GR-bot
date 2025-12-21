import { useSystemHealth, getHealthColor, getHealthBgColor } from "@/hooks/useSystemHealth";
import { Card } from "@/components/ui/card";
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

/**
 * SystemHealthMonitor Component
 * Displays real-time CPU, memory, disk, and bot engine performance
 */

interface HealthMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  percentage?: number;
  icon: React.ReactNode;
  loading?: boolean;
}

function HealthMetricCard({
  label,
  value,
  unit,
  percentage,
  icon,
  loading,
}: HealthMetricProps) {
  return (
    <Card className="metric-card">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-accent">{icon}</div>
            <p className="metric-label">{label}</p>
          </div>
          {loading && <div className="animate-spin">⟳</div>}
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="metric-value">
              {loading ? "..." : value}
            </span>
            {unit && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </div>
          {percentage !== undefined && (
            <div className="space-y-1">
              <Progress value={percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {percentage.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function SystemHealthMonitor() {
  const {
    health,
    healthLoading,
    enginePerformance,
    engineLoading,
    combined,
    combinedLoading,
  } = useSystemHealth();

  const isLoading = healthLoading || engineLoading || combinedLoading;
  const healthStatus = enginePerformance?.health || "poor";
  const healthColorClass = getHealthColor(healthStatus);
  const healthBgClass = getHealthBgColor(healthStatus);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Health Status Header */}
      <div className={`rounded-lg p-4 ${healthBgClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className={`${healthColorClass}`} size={24} />
            <div>
              <p className="font-semibold text-foreground">Bot Engine Health</p>
              <p className={`text-sm font-medium ${healthColorClass}`}>
                {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {enginePerformance?.lastUpdate
              ? new Date(enginePerformance.lastUpdate).toLocaleTimeString()
              : "Loading..."}
          </p>
        </div>
      </div>

      {/* System Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          System Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthMetricCard
            label="CPU Usage"
            value={health?.cpu.usage.toFixed(1) || 0}
            unit="%"
            percentage={health?.cpu.usage || 0}
            icon={<Cpu size={20} />}
            loading={isLoading}
          />
          <HealthMetricCard
            label="Memory Usage"
            value={`${health?.memory.used || 0}/${health?.memory.total || 0}`}
            unit="MB"
            percentage={health?.memory.usage || 0}
            icon={<Activity size={20} />}
            loading={isLoading}
          />
          <HealthMetricCard
            label="Disk Usage"
            value={`${health?.disk.used || 0}/${health?.disk.total || 0}`}
            unit="MB"
            percentage={health?.disk.usage || 0}
            icon={<HardDrive size={20} />}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Engine Performance */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Engine Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <HealthMetricCard
            label="API Response"
            value={enginePerformance?.apiResponseTime || 0}
            unit="ms"
            icon={<Zap size={20} />}
            loading={isLoading}
          />
          <HealthMetricCard
            label="Strategy Calc"
            value={enginePerformance?.strategyCalculationTime || 0}
            unit="ms"
            icon={<Cpu size={20} />}
            loading={isLoading}
          />
          <HealthMetricCard
            label="Candle Process"
            value={enginePerformance?.candleProcessingTime || 0}
            unit="ms"
            icon={<Activity size={20} />}
            loading={isLoading}
          />
          <HealthMetricCard
            label="Trade Eval"
            value={enginePerformance?.tradeEvaluationTime || 0}
            unit="ms"
            icon={<Clock size={20} />}
            loading={isLoading}
          />
        </div>
      </div>

      {/* System Info */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          System Information
        </h3>
        <Card className="metric-card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">CPU Cores</p>
              <p className="font-mono font-semibold text-foreground">
                {health?.cpu.cores || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">CPU Model</p>
              <p className="font-mono text-sm text-foreground truncate">
                {health?.cpu.model || "Unknown"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="font-mono font-semibold text-foreground">
                {health ? formatUptime(health.uptime) : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Last Update</p>
              <p className="font-mono text-sm text-foreground">
                {health
                  ? new Date(health.timestamp).toLocaleTimeString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Warnings */}
      {(health?.cpu.usage || 0) > 80 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-yellow-700 dark:text-yellow-400">
              High CPU Usage
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-300">
              CPU usage is above 80%. Consider checking for resource-heavy processes.
            </p>
          </div>
        </div>
      )}

      {(health?.memory.usage || 0) > 85 && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
          <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              Critical Memory Usage
            </p>
            <p className="text-sm text-red-600 dark:text-red-300">
              Memory usage is above 85%. Consider restarting the bot or freeing up resources.
            </p>
          </div>
        </div>
      )}

      {enginePerformance?.health === "poor" && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              Poor Engine Performance
            </p>
            <p className="text-sm text-red-600 dark:text-red-300">
              API response time is high. The bot may be struggling to keep up with market conditions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
