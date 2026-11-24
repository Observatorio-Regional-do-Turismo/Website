"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

interface ShareButtonProps {
  path: string;
  label?: string;
  copiedLabel?: string;
  variant?: "outline" | "light" | "primary";
  className?: string;
}

export function ShareButton({
  path,
  label = "Compartilhar",
  copiedLabel = "Link copiado!",
  variant = "outline",
  className = "",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl =
      typeof window !== "undefined" ? new URL(path, window.location.origin).toString() : path;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const baseStyles =
    variant === "light"
      ? "bg-white/90 hover:bg-white text-slate-800 border border-white/60 shadow-sm backdrop-blur-sm"
      : variant === "primary"
        ? "bg-[#1D5C1B] hover:bg-[#164714] text-white border border-[#1D5C1B] shadow-sm"
        : "border border-slate-200 hover:bg-slate-100 text-slate-700 bg-white";

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${baseStyles} ${className}`}
      title={label}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className={variant === "primary" ? "text-emerald-200" : "text-emerald-700"}>
            {copiedLabel}
          </span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
