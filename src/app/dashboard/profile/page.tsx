"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  ShieldCheck,
  Mail,
  Globe,
  MapPin,
  UploadCloud,
  Loader2,
  CheckCircle2,
  XCircle,
  Camera,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const photoInput = useRef<HTMLInputElement>(null);
  const { update: updateSession } = useSession();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, ...(photo ? { profilePhoto: photo } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save profile.");
      setUser((previous: any) => ({ ...previous, ...data.profile }));
      setPhoto(null);
      await updateSession();
      setMessage({ text: "Profile saved successfully.", type: "success" });
    } catch (error: any) { setMessage({ text: error.message, type: "error" }); }
    finally { setSaving(false); }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string | null>>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage({ text: "Choose a PNG, JPEG or WebP image under 5 MB.", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitKYC = async () => {
    if (!frontImage || !backImage || !selfieImage) {
      setMessage({
        text: "Please upload all 3 required documents.",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontImage, backImage, selfieImage, name, phone }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        fetchData(); // refresh status
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "An error occurred during upload.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-brand-mint" size={40} />
      </div>

    );
  }

  const { verificationStatus } = user || {};

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          Account <span className="text-brand-mint">Profile & KYC</span>
        </h1>
        <p className="text-zinc-500 font-bold tracking-normal text-[10px]">
          Manage your personal details and verification
        </p>
      </div>

      {message && <p role="status" className={`rounded-lg p-4 text-sm ${message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-400"}`}>{message.text}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 space-y-8"
        >
          <div className="glass p-8 rounded-lg border-white/5 relative overflow-hidden text-center group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-mint/5 rounded-full blur-3xl pointer-events-none" />

            <button type="button" aria-label="Change profile photo" title="Click to add or change your photo" onClick={() => photoInput.current?.click()} disabled={saving || submitting} className="w-24 h-24 mx-auto rounded-full bg-black border border-white/10 flex items-center justify-center text-3xl font-semibold text-brand-mint shadow-2xl mb-3 relative focus-visible:outline-2 focus-visible:outline-brand-mint">
              <UserAvatar name={user?.name} photo={photo || user?.profilePhoto} alt="Your profile photo" />
              <span className="absolute -bottom-1 -right-1 rounded-full bg-brand-mint text-black p-2 border-2 border-[#0a0f16]"><Camera size={16} /></span>
              {verificationStatus === "verified" && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-black rounded-full p-1 border-[3px] border-[#0a0f16]">
                  <ShieldCheck size={16} />
                </span>
              )}
            </button>
            <button type="button" className="text-sm text-brand-mint underline underline-offset-4" onClick={() => photoInput.current?.click()} disabled={saving || submitting}>{user?.profilePhoto || photo ? "Change photo" : "Add profile photo"}</button>
            {photo && <p className="mt-2 text-xs text-zinc-400">Photo selected. Save your profile to upload it.</p>}
            <form onSubmit={saveProfile} className="space-y-4 text-left mt-6">
              <label className="block text-sm">Full name
                <input aria-label="Full name" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={100} autoComplete="name" className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 p-3" />
              </label>
              <label className="block text-sm">Phone number
                <input aria-label="Phone number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" maxLength={30} placeholder="+234 800 000 0000" className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 p-3" />
              </label>
              <label className="block text-sm">Profile photo
                <input ref={photoInput} aria-label="Profile photo" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full min-w-0 text-xs" onChange={e => {
                  if (e.target.files?.[0] && e.target.files[0].size > 1024 * 1024) {
                    setMessage({ text: "Choose a profile photo under 1 MB.", type: "error" }); return;
                  }
                  handleFileUpload(e, setPhoto);
                }} />
              </label>
              <p className="text-xs text-zinc-400">PNG, JPEG or WebP, up to 1 MB. Your photo is stored with ImageKit.</p>
              <button disabled={saving || submitting} className="w-full rounded-lg bg-brand-mint text-black p-3 font-semibold disabled:opacity-50">{saving ? "Saving..." : "Save profile"}</button>
            </form>

            <h2 className="text-2xl font-semibold tracking-normal mt-6 mb-2">
              {user?.name}
            </h2>

            <div className="inline-flex items-center gap-2 bg-[var(--card-bg)] px-4 py-1.5 rounded-full mb-8">
              <Mail size={12} className="text-brand-mint" />
              <span className="text-[10px] font-bold text-zinc-400 tracking-normal">
                {user?.email}
              </span>
            </div>

            <div className="space-y-4 text-left border-t border-white/5 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-500">
                  <Globe size={16} />
                  <span className="text-xs font-bold tracking-normal">
                    Base Currency
                  </span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {user?.currency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-500">
                  <MapPin size={16} />
                  <span className="text-xs font-bold tracking-normal">
                    Region
                  </span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {user?.country || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KYC Submission Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="glass p-8 md:p-12 rounded-lg border-white/5 h-full">
            <div className="mb-10 text-center md:text-left">
              <h3 className="text-xl font-semibold tracking-normal flex items-center justify-center md:justify-start gap-3 mb-2">
                <ShieldCheck className="text-brand-mint" size={24} />
                Identity verification
              </h3>
              <p className="text-zinc-500 text-xs font-bold leading-relaxed tracking-normal">
                Comply with global anti-money laundering regulations by
                submitting valid identification.
              </p>
            </div>

            {verificationStatus === "verified" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center animate-pulse">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h4 className="text-2xl font-semibold text-green-500 tracking-normal mb-2">
                    Account Verified
                  </h4>
                  <p className="text-zinc-400 text-sm font-medium">
                    Your identity has been successfully authenticated by our
                    compliance team.
                  </p>
                </div>
              </div>
            ) : verificationStatus === "pending" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center animate-pulse">
                  <Loader2 size={48} className="animate-spin" />
                </div>
                <div>
                  <h4 className="text-2xl font-semibold text-amber-500 tracking-normal mb-2">
                    Review in Progress
                  </h4>
                  <p className="text-zinc-400 text-sm font-medium">
                    Your documents are securely held and are being reviewed by
                    compliance officers.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {verificationStatus === "rejected" && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 flex gap-4 text-red-500">
                    <XCircle size={24} className="shrink-0" />
                    <div>
                      <p className="text-sm font-semibold mb-1">
                        Verification Rejected
                      </p>
                      <p className="text-xs font-medium text-red-400">
                        Unfortunately, your uploaded documents were not
                        accepted. Please ensure they are clear, valid, and
                        recent, then submit them again.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DocumentUploadBox
                    label="Front of ID"
                    image={frontImage}
                    setImage={setFrontImage}
                    onUpload={handleFileUpload}
                  />
                  <DocumentUploadBox
                    label="Back of ID"
                    image={backImage}
                    setImage={setBackImage}
                    onUpload={handleFileUpload}
                  />
                </div>

                <div className="max-w-md mx-auto">
                  <DocumentUploadBox
                    label="Selfie with ID"
                    image={selfieImage}
                    setImage={setSelfieImage}
                    onUpload={handleFileUpload}
                  />
                </div>

                <p className="text-xs text-zinc-400">Add your full name and phone number in the profile form before submitting your documents.</p>

                <button
                  onClick={handleSubmitKYC}
                  disabled={submitting || saving || !name.trim() || !phone.trim()}
                  className="w-full py-5 rounded-lg bg-brand-mint text-black font-semibold tracking-normal hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-brand-mint/20 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <UploadCloud size={20} />
                  )}
                  {submitting ? "Uploading Securely..." : "Submit Documents"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DocumentUploadBox({
  label,
  image,
  setImage,
  onUpload,
}: {
  label: string;
  image: string | null;
  setImage: (s: string | null) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, setter: any) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold tracking-normal text-zinc-500">
        {label}
      </p>
      <label className="block w-full aspect-video rounded-lg border-2 border-dashed border-white/10 hover:border-brand-mint/40 bg-[var(--card-bg)] transition-all cursor-pointer overflow-hidden group relative">
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => onUpload(e, setImage)}
        />
        {image ? (
          <img
            src={image}
            alt="Upload Preview"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 group-hover:text-brand-mint transition-colors space-y-2">
            <UploadCloud size={32} />
            <span className="text-[10px] font-semibold tracking-normal">
              Click to Upload
            </span>
          </div>
        )}
      </label>
    </div>
  );
}
