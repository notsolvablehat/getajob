import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ScrapeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (company: string) => void;
  isLoading?: boolean;
}

export function ScrapeModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: ScrapeModalProps) {
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const slug = company.trim().toLowerCase();
    if (!slug) {
      setError("Company slug is required.");
      return;
    }
    setError("");
    onConfirm(slug);
  }

  function handleOpenChange(v: boolean) {
    if (!isLoading) {
      setCompany("");
      setError("");
      onOpenChange(v);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-white/[0.07] bg-[#141416]">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold tracking-tight text-[#ececec]">
            Scrape Jobs
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#7a7a85]">
            Enter the Greenhouse company slug to fetch open roles. For example,
            for <code className="text-[#7c6fff]">linear.app</code> jobs use{" "}
            <code className="text-[#7c6fff]">linear</code>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="company-slug"
              className="text-[12px] font-medium text-[#7a7a85]"
            >
              Company slug
            </Label>
            <Input
              id="company-slug"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setError("");
              }}
              placeholder="e.g. linear, vercel, stripe"
              autoFocus
              disabled={isLoading}
              className="border-white/[0.07] bg-[#1a1a1d] text-[#ececec] placeholder:text-[#4a4a55] focus-visible:border-[#7c6fff]/40 focus-visible:ring-0"
            />
            {error && (
              <p className="text-[12px] text-[#f87171]">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="border-white/[0.11] bg-[#212126] text-[#7a7a85] hover:bg-[#1a1a1d] hover:text-[#ececec]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !company.trim()}
              className="gap-2 bg-[#7c6fff] text-white hover:bg-[#8c7fff]"
              style={{ boxShadow: "0 2px 12px rgba(124,111,255,0.25)" }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Scraping…
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  Scrape Jobs
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
