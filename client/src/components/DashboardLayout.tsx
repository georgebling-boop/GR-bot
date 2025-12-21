import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeNav: string;
  onNavChange: (nav: string) => void;
}

export default function DashboardLayout({
  children,
  activeNav,
  onNavChange,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "trades", label: "Open Trades", icon: "💱" },
    { id: "history", label: "Trade History", icon: "📜" },
    { id: "performance", label: "Performance", icon: "📈" },
    { id: "health", label: "System Health", icon: "🏥" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-sidebar-foreground">
              George's Trade Bot
            </h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent/10"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                activeNav === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/10"
              }`}
              title={!sidebarOpen ? item.label : ""}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer Status */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="status-indicator status-active" />
            {sidebarOpen && (
              <span className="text-xs text-sidebar-foreground/70">
                Connected
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}
