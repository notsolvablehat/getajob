import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface ScreenshotModalProps {
  fileId: string | null;
  jobTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScreenshotModal({
  fileId,
  jobTitle,
  open,
  onOpenChange,
}: ScreenshotModalProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const src = fileId
    ? `${BASE_URL}/api/apply/screenshot/${fileId}`
    : null;

  function handleOpenChange(v: boolean) {
    if (!v) {
      setImgError(false);
      setImgLoaded(false);
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl border-white/[0.07] bg-[#141416] p-3">
        {jobTitle && (
          <p className="mb-2 text-[13px] font-medium text-[#ececec]">
            Screenshot — {jobTitle}
          </p>
        )}
        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-lg bg-[#0d0d0f]">
          {!imgLoaded && !imgError && src && (
            <Loader2 className="animate-spin text-[#7c6fff]" size={28} />
          )}
          {imgError && (
            <div className="flex flex-col items-center gap-2 text-[#7a7a85]">
              <AlertCircle size={28} />
              <p className="text-[13px]">Screenshot not available</p>
            </div>
          )}
          {src && !imgError && (
            // We need to pass the Authorization header — use an object URL approach
            <AuthenticatedImage
              src={src}
              alt={`Screenshot for ${jobTitle}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Authenticated image component: fetches image with JWT and creates an object URL
import { useEffect } from "react";
import { getToken } from "@/lib/auth";

function AuthenticatedImage({
  src,
  alt,
  onLoad,
  onError,
}: {
  src: string;
  alt: string;
  onLoad: () => void;
  onError: () => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url: string | null = null;
    const token = getToken();

    fetch(src, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.blob();
      })
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setObjectUrl(url);
        setLoading(false);
        onLoad();
      })
      .catch(() => {
        setLoading(false);
        onError();
      });

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [src, onLoad, onError]);

  if (loading) {
    return <Loader2 className="animate-spin text-[#7c6fff]" size={28} />;
  }

  if (!objectUrl) return null;

  return (
    <img
      src={objectUrl}
      alt={alt}
      className="max-h-[70vh] w-full rounded-lg object-contain"
    />
  );
}
