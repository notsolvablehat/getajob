import { useRef } from "react";
import { toast } from "sonner";
import { FileText, Upload, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Resume } from "@/hooks/useProfile";
import { useUploadResume } from "@/hooks/useProfile";

interface ResumeUploadProps {
  resume: Resume | undefined;
  isLoading?: boolean;
}

export function ResumeUpload({ resume, isLoading = false }: ResumeUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadResume = useUploadResume();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF resumes are supported.");
      return;
    }

    try {
      await uploadResume.mutateAsync(file);
      toast.success("Resume uploaded!");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Upload failed.";
      toast.error(msg);
    } finally {
      // Reset so user can re-upload same file
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const uploading = uploadResume.isPending;

  return (
    <div
      className="flex flex-col gap-4 rounded-[14px] border border-white/[0.07] p-5"
      style={{ background: "#141416" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[14px] font-semibold text-[#ececec]">Resume</h3>
          <p className="mt-0.5 text-[12px] text-[#7a7a85]">
            PDF only · Active resume used for all applications
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 gap-1.5 rounded-full border-white/[0.11] bg-[#212126] text-[12px] text-[#7a7a85] hover:bg-[#1a1a1d] hover:text-[#ececec]"
        >
          {uploading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Upload size={13} />
          )}
          {uploading ? "Uploading…" : "Upload Resume"}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Current resume */}
      {isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-[#1a1a1d] p-3">
          <div className="h-8 w-8 animate-pulse rounded-md bg-[#212126]" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-32 animate-pulse rounded bg-[#212126]" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-[#212126]" />
          </div>
        </div>
      ) : resume ? (
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-[#1a1a1d] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[rgba(124,111,255,0.12)]">
            <FileText size={18} className="text-[#7c6fff]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[#ececec]">
              {resume.filename}
            </p>
            <p className="text-[11px] text-[#4a4a55]">
              Uploaded{" "}
              {new Date(resume.uploaded_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          {resume.download_url && (
            <a
              href={resume.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.07] px-2.5 py-1 text-[11px] text-[#7a7a85] transition-colors hover:border-white/[0.15] hover:text-[#ececec]"
            >
              Download
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      ) : (
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/[0.11] py-10 transition-colors hover:border-[#7c6fff]/40 hover:bg-[rgba(124,111,255,0.03)]"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(124,111,255,0.08)]">
            <Upload size={18} className="text-[#7c6fff]" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium text-[#7a7a85]">
              No resume uploaded
            </p>
            <p className="text-[12px] text-[#4a4a55]">
              Click to upload a PDF
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
