import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Settings Page Content
 * Bot configuration and user preferences
 */

export function SettingsPageContent() {
  const [settings, setSettings] = useState({
    botName: "George's Trade Bot",
    apiUrl: "http://localhost:8080",
    apiKey: "",
    refreshInterval: 5,
    enableNotifications: true,
    enableAlerts: true,
    maxDrawdownAlert: 10,
    profitTarget: 5,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "number" ? parseFloat(value) : value,
    }));
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-background to-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Settings
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure your bot and dashboard preferences
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8 space-y-8 max-w-2xl">
        {/* Bot Configuration */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Bot Configuration
          </h2>
          <Card className="metric-card space-y-6">
            {/* Bot Name */}
            <div className="space-y-2">
              <Label htmlFor="botName" className="text-foreground">
                Bot Name
              </Label>
              <Input
                id="botName"
                name="botName"
                value={settings.botName}
                onChange={handleInputChange}
                placeholder="Enter bot name"
                className="bg-background border-border"
              />
            </div>

            {/* API URL */}
            <div className="space-y-2">
              <Label htmlFor="apiUrl" className="text-foreground">
                Freqtrade API URL
              </Label>
              <Input
                id="apiUrl"
                name="apiUrl"
                value={settings.apiUrl}
                onChange={handleInputChange}
                placeholder="http://localhost:8080"
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">
                The URL where your Freqtrade bot is running
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-foreground">
                API Key (Optional)
              </Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                value={settings.apiKey}
                onChange={handleInputChange}
                placeholder="Enter API key if required"
                className="bg-background border-border"
              />
            </div>
          </Card>
        </section>

        {/* Dashboard Preferences */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Dashboard Preferences
          </h2>
          <Card className="metric-card space-y-6">
            {/* Refresh Interval */}
            <div className="space-y-2">
              <Label htmlFor="refreshInterval" className="text-foreground">
                Data Refresh Interval (seconds)
              </Label>
              <Input
                id="refreshInterval"
                name="refreshInterval"
                type="number"
                min="1"
                max="60"
                value={settings.refreshInterval}
                onChange={handleInputChange}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">
                How often to fetch new data from the bot
              </p>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">
                  Enable Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications for trade events
                </p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={() =>
                  handleToggle("enableNotifications")
                }
              />
            </div>

            {/* Alerts Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">Enable Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Alert when performance thresholds are exceeded
                </p>
              </div>
              <Switch
                checked={settings.enableAlerts}
                onCheckedChange={() => handleToggle("enableAlerts")}
              />
            </div>
          </Card>
        </section>

        {/* Alert Thresholds */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Alert Thresholds
          </h2>
          <Card className="metric-card space-y-6">
            {/* Max Drawdown Alert */}
            <div className="space-y-2">
              <Label htmlFor="maxDrawdownAlert" className="text-foreground">
                Max Drawdown Alert (%)
              </Label>
              <Input
                id="maxDrawdownAlert"
                name="maxDrawdownAlert"
                type="number"
                min="1"
                max="50"
                value={settings.maxDrawdownAlert}
                onChange={handleInputChange}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">
                Alert when drawdown exceeds this percentage
              </p>
            </div>

            {/* Profit Target */}
            <div className="space-y-2">
              <Label htmlFor="profitTarget" className="text-foreground">
                Profit Target (%)
              </Label>
              <Input
                id="profitTarget"
                name="profitTarget"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={settings.profitTarget}
                onChange={handleInputChange}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">
                Daily profit target to track
              </p>
            </div>
          </Card>
        </section>

        {/* System Status */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">
            System Status
          </h2>
          <Card className="metric-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-accent" size={20} />
                <div>
                  <p className="font-semibold text-foreground">
                    Dashboard Connected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last sync: Just now
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-yellow-500" size={20} />
                <div>
                  <p className="font-semibold text-foreground">
                    Bot Connection
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Waiting for bot connection...
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-xl font-bold text-destructive mb-4">
            Danger Zone
          </h2>
          <Card className="metric-card border-destructive/20 bg-destructive/5 space-y-4">
            <p className="text-sm text-muted-foreground">
              These actions cannot be undone. Please proceed with caution.
            </p>
            <Button variant="destructive" className="w-full">
              Reset All Settings
            </Button>
            <Button variant="destructive" className="w-full">
              Clear Cache
            </Button>
          </Card>
        </section>
      </div>
    </div>
  );
}
