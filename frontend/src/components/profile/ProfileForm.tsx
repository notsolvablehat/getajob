import { useState } from "react";
import { toast } from "sonner";
import { Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CandidateProfile, ProfileUpdate } from "@/hooks/useProfile";
import { useUpdateProfile } from "@/hooks/useProfile";

interface ProfileFormProps {
  profile: CandidateProfile | undefined;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState<ProfileUpdate>({
    full_name: profile?.full_name ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    linkedin_url: profile?.linkedin_url ?? "",
    github_url: profile?.github_url ?? "",
    portfolio_url: profile?.portfolio_url ?? "",
    location: profile?.location ?? "",
    bio: profile?.bio ?? "",
    years_experience: profile?.years_experience ?? undefined,
    skills: profile?.skills ?? [],
  });

  const [skillInput, setSkillInput] = useState("");

  function set(field: keyof ProfileUpdate, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (!s) return;
    if (!form.skills?.includes(s)) {
      set("skills", [...(form.skills ?? []), s]);
    }
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    set(
      "skills",
      (form.skills ?? []).filter((s) => s !== skill),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(form);
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile.");
    }
  }

  const fields: Array<{
    key: keyof ProfileUpdate;
    label: string;
    placeholder: string;
    type?: string;
  }> = [
    { key: "full_name", label: "Full Name", placeholder: "Jane Doe" },
    { key: "email", label: "Email", placeholder: "jane@example.com", type: "email" },
    { key: "phone", label: "Phone", placeholder: "+1 555 000 0000" },
    { key: "location", label: "Location", placeholder: "San Francisco, CA" },
    { key: "linkedin_url", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/jane" },
    { key: "github_url", label: "GitHub URL", placeholder: "https://github.com/jane" },
    { key: "portfolio_url", label: "Portfolio URL", placeholder: "https://jane.dev" },
    { key: "years_experience", label: "Years of Experience", placeholder: "3", type: "number" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Field grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, placeholder, type = "text" }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label className="text-[12px] font-medium text-[#7a7a85]">
              {label}
            </Label>
            <Input
              type={type}
              placeholder={placeholder}
              value={
                type === "number"
                  ? ((form[key] as number | undefined) ?? "")
                  : ((form[key] as string | undefined) ?? "")
              }
              onChange={(e) =>
                set(
                  key,
                  type === "number"
                    ? e.target.value === ""
                      ? undefined
                      : Number(e.target.value)
                    : e.target.value,
                )
              }
              className="border-white/[0.07] bg-[#1a1a1d] text-[#ececec] placeholder:text-[#4a4a55] focus-visible:border-[#7c6fff]/40 focus-visible:ring-0"
            />
          </div>
        ))}
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[12px] font-medium text-[#7a7a85]">Bio</Label>
        <textarea
          placeholder="A brief professional summary…"
          value={form.bio ?? ""}
          onChange={(e) => set("bio", e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border border-white/[0.07] bg-[#1a1a1d] px-3 py-2 text-[13px] text-[#ececec] placeholder:text-[#4a4a55] outline-none transition-colors focus:border-[#7c6fff]/40"
        />
      </div>

      {/* Skills */}
      <div className="flex flex-col gap-2">
        <Label className="text-[12px] font-medium text-[#7a7a85]">Skills</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a skill (e.g. React)"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            className="border-white/[0.07] bg-[#1a1a1d] text-[#ececec] placeholder:text-[#4a4a55] focus-visible:border-[#7c6fff]/40 focus-visible:ring-0"
          />
          <Button
            type="button"
            onClick={addSkill}
            variant="outline"
            size="sm"
            className="shrink-0 border-white/[0.11] bg-[#212126] text-[#7a7a85] hover:bg-[#1a1a1d] hover:text-[#ececec]"
          >
            <Plus size={14} />
          </Button>
        </div>
        {(form.skills?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {form.skills!.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-[#212126] px-2.5 py-0.5 text-[12px] text-[#ececec]"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-[#4a4a55] transition-colors hover:text-[#f87171]"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={updateProfile.isPending}
        className="w-fit gap-2 rounded-full bg-[#7c6fff] px-5 text-white hover:bg-[#8c7fff]"
        style={{ boxShadow: "0 2px 12px rgba(124,111,255,0.25)" }}
      >
        {updateProfile.isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Saving…
          </>
        ) : (
          "Save Profile"
        )}
      </Button>
    </form>
  );
}
