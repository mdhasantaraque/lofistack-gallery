import { codeToHtml } from "shiki";
import { CopyButton } from "./copy-button";

interface CodeBlockProps {
  code: string;
  title?: string;
  lang?: string;
  /** Caps the height and scrolls, for long source files. */
  maxHeight?: number;
}

async function highlight(code: string, lang: string) {
  "use cache";
  return codeToHtml(code, { lang, theme: "github-dark-default" });
}

export async function CodeBlock({ code, title, lang = "tsx", maxHeight }: CodeBlockProps) {
  const html = await highlight(code.trim(), lang);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#0d1117]">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-2">
        <span className="truncate font-mono text-xs text-zinc-400">{title}</span>
        <CopyButton text={code.trim()} />
      </div>
      <div
        className="code-block overflow-auto text-[13px] leading-relaxed"
        style={maxHeight ? { maxHeight } : undefined}
        tabIndex={0}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
