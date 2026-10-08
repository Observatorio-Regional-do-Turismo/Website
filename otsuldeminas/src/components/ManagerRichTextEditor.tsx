"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Underline,
} from "lucide-react";

interface ManagerRichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const tools = [
  { label: "Negrito", command: "bold", icon: Bold },
  { label: "Itálico", command: "italic", icon: Italic },
  { label: "Sublinhado", command: "underline", icon: Underline },
  { label: "Título 2", command: "formatBlock", value: "h2", icon: Heading2 },
  { label: "Lista", command: "insertUnorderedList", icon: List },
  { label: "Lista numerada", command: "insertOrderedList", icon: ListOrdered },
  { label: "Citação", command: "formatBlock", value: "blockquote", icon: Quote },
];

export function ManagerRichTextEditor({ label, value, onChange }: ManagerRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertLink = () => {
    const href = window.prompt("Endereço do link (https://...)");
    if (!href) return;
    runCommand("createLink", href);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-[#359830] focus-within:ring-2 focus-within:ring-[#359830]/20">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2" role="toolbar" aria-label={`Ferramentas de ${label}`}>
        {tools.map(({ label: toolLabel, command, value: commandValue, icon: Icon }) => (
          <button
            key={toolLabel}
            type="button"
            title={toolLabel}
            aria-label={toolLabel}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command, commandValue)}
            className="rounded-lg p-2 text-slate-700 transition hover:bg-emerald-100 hover:text-[#1D5C1B]"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          title="Inserir link"
          aria-label="Inserir link"
          onMouseDown={(event) => event.preventDefault()}
          onClick={insertLink}
          className="rounded-lg p-2 text-slate-700 transition hover:bg-emerald-100 hover:text-[#1D5C1B]"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={label}
        aria-multiline="true"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="min-h-48 max-h-[32rem] overflow-y-auto px-4 py-3 text-sm leading-6 text-slate-800 outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-600 [&_blockquote]:pl-3 [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  );
}
