import { cn } from "@/lib/utils";

interface RichTextContentProps {
  html?: string | null;
  fallback?: string;
  className?: string;
}

function sanitizeHtmlDefenseInDepth(rawHtml: string): string {
  return rawHtml
    .replace(/<(script|style|iframe|object|embed|svg|math|form)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|iframe|object|embed|meta|link|base)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /(href|src)\s*=\s*(["'])\s*(?:javascript|vbscript|data:text\/html)[^"']*\2/gi,
      '$1="#"',
    );
}

export function RichTextContent({ html, fallback = "", className }: RichTextContentProps) {
  const trimmed = (html || "").trim();
  if (!trimmed || trimmed === "string") {
    return fallback ? (
      <p className={cn("text-sm leading-relaxed text-slate-600 sm:text-base", className)}>
        {fallback}
      </p>
    ) : null;
  }

  const hasHtml = /<[a-z][\s\S]*>/i.test(trimmed);
  if (!hasHtml) {
    return (
      <div className={cn("rich-text-content text-sm sm:text-base", className)}>
        {trimmed
          .split("\n\n")
          .filter((p) => p.trim())
          .map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
      </div>
    );
  }

  const safeHtml = sanitizeHtmlDefenseInDepth(trimmed);

  return (
    <div
      className={cn("rich-text-content text-sm sm:text-base", className)}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
