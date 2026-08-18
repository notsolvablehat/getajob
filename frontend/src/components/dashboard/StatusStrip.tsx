import { Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusStripProps {
  jobCount: number;
  onStop?: () => void;
}

export function StatusStrip({ jobCount, onStop }: StatusStripProps) {
  return (
    <div
      className="mb-5 flex items-center justify-between gap-4 rounded-[10px] border border-white/[0.11] px-4 py-2.5"
      style={{ background: "#1a1a1d" }}
    >
      {/* Left: animated dot + text */}
      <div className="flex items-center gap-2.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-[#7c6fff]"
          style={{
            boxShadow: "0 0 6px rgba(124,111,255,0.4)",
            animation: "gaj-blink 1.2s ease-in-out infinite",
          }}
        />
        <span className="text-[13px] font-[450] text-[#ececec]">
          Collecting jobs from Greenhouse…
        </span>
      </div>

      {/* Right: counter + stop */}
      <div className="flex items-center gap-4">
        {jobCount > 0 && (
          <span className="flex items-center gap-1.5 text-[12px] text-[#7a7a85]">
            <strong className="text-[#ececec] tabular-nums">{jobCount}</strong>
            {" "}found so far
          </span>
        )}
        <Button
          size="sm"
          onClick={onStop}
          className="h-[26px] gap-1.5 rounded-full border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.12)] px-3 text-[11px] text-[#f87171] hover:bg-[rgba(248,113,113,0.2)]"
          style={{ boxShadow: "none" }}
        >
          <Square size={11} />
          Stop
        </Button>
      </div>

      <style>{`
        @keyframes gaj-blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

export function ScrapingIndicator() {
  return (
    <div className="flex items-center gap-2 text-[13px] text-[#7a7a85]">
      <Loader2 size={13} className="animate-spin text-[#7c6fff]" />
      <span>Collecting jobs…</span>
    </div>
  );
}
