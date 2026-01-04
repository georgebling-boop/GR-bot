import { useEffect, useState } from "react";
import { Info } from "lucide-react";

interface BuildInfo {
  gitSha: string;
  gitBranch: string;
  buildTime: string;
  buildTimestamp: number;
}

/**
 * BuildInfo component - displays build metadata in the UI footer.
 * 
 * Note: This is a client-only component. The date formatting uses toLocaleString()
 * which formats based on the user's browser timezone, ensuring consistent display
 * in the client environment.
 */
export function BuildInfo() {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/build-info.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch build info: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setBuildInfo(data);
        setLoading(false);
      })
      .catch((error) => {
        console.warn("Could not load build info:", error);
        setLoading(false);
      });
  }, []);

  if (loading || !buildInfo) {
    return null;
  }

  const shortCommitSha = buildInfo.gitSha.length >= 7 ? buildInfo.gitSha.substring(0, 7) : buildInfo.gitSha;
  const buildDate = new Date(buildInfo.buildTime).toLocaleString();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Info className="h-3 w-3" aria-hidden="true" />
      <span>
        Build: <span className="font-mono">{shortCommitSha}</span>
        {buildInfo.gitBranch !== "unknown" && (
          <span className="ml-1">({buildInfo.gitBranch})</span>
        )}
      </span>
      <span className="text-muted-foreground/60">•</span>
      <span>{buildDate}</span>
    </div>
  );
}
