import DashboardLayout from "@/components/DashboardLayout";
import SystemHealthMonitor from "@/components/SystemHealthMonitor";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { toast } from "sonner";

/**
 * System Health Page
 * Displays real-time CPU, memory, disk, and bot engine performance metrics
 */

export default function SystemHealthPage() {
  const [activeNav, setActiveNav] = useState("health");
  const { refresh, isLoading } = useSystemHealth();

  const handleRefresh = async () => {
    await refresh();
    toast.success("Health metrics refreshed");
  };

  return (
    <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
      <div className="h-full overflow-auto bg-gradient-to-b from-background to-background">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
          <div className="container py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  System Health
                </h1>
                <p className="text-muted-foreground mt-1">
                  Real-time monitoring of bot performance and system resources
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-8">
          <SystemHealthMonitor />
        </div>
      </div>
    </DashboardLayout>
  );
}
