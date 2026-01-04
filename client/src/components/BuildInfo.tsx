import { useEffect, useState } from "react";
import { Info } from "lucide-react";

interface BuildInfo {
  gitSha: string;
  gitBranch: string;
  buildTime: string;
  buildTimestamp: number;
}

export function BuildInfo() {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/build-info.json")
      .then((res) => res.json())
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

  const shortSha = buildInfo.gitSha.length >= 7 ? buildInfo.gitSha.substring(0, 7) : buildInfo.gitSha;
  const buildDate = new Date(buildInfo.buildTime).toLocaleString();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Info className="h-3 w-3" />
      <span>
        Build: <span className="font-mono">{shortSha}</span>
        {buildInfo.gitBranch !== "unknown" && (
          <span className="ml-1">({buildInfo.gitBranch})</span>
        )}
      </span>
      <span className="text-muted-foreground/60">•</span>
      <span>{buildDate}</span>
    </div>
  );
}
