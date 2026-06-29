import React, { useState } from "react";
import { ToneContext, AttachmentFile } from "../types";
import { Sparkles, FileText, Trash2, HelpCircle, Loader2, Upload, FileUp } from "lucide-react";

interface TonePanelProps {
  toneContext: ToneContext;
  setToneContext: (ctx: ToneContext) => void;
  attachments: AttachmentFile[];
  onAddAttachment: (file: AttachmentFile) => void;
  onRemoveAttachment: (name: string) => void;
  initialPrompt: string;
  setInitialPrompt: (prompt: string) => void;
  onGenerateInitial: () => void;
  isGeneratingInitial: boolean;
  hasDocumentContent: boolean;
  onClearDocument: () => void;
}

const TONES = ["Creative & Poetic", "Suspenseful Novelist", "Academic & Editorial", "Technical Deep Dive", "Casual Blog", "Sales Copywriting"];
const AUDIENCES = ["General Readers", "Subject Experts", "Young Adults / Kids", "Investors & Execs"];
const GOALS = ["Entertain & Immersive", "Educate & Explain", "Persuade & Convert", "Hook & Spark Interest"];

export default function TonePanel({
  toneContext,
  setToneContext,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  initialPrompt,
  setInitialPrompt,
  onGenerateInitial,
  isGeneratingInitial,
  hasDocumentContent,
  onClearDocument,
}: TonePanelProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleContextChange = (key: keyof ToneContext, value: string) => {
    setToneContext({
      ...toneContext,
      [key]: value,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const rawResult = event.target.result as string;
          // Extract base64 details
          const commaIdx = rawResult.indexOf(",");
          const base64Data = commaIdx > -1 ? rawResult.substring(commaIdx + 1) : rawResult;

          onAddAttachment({
            name: file.name,
            mimeType: file.type || "text/plain",
            data: base64Data,
            size: file.size,
          });
        }
      };
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        reader.readAsDataURL(file);
      } else {
        // Read text/markdown docs as raw base64 encoded text
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const rawResult = event.target.result as string;
            const commaIdx = rawResult.indexOf(",");
            const base64Data = commaIdx > -1 ? rawResult.substring(commaIdx + 1) : rawResult;

            onAddAttachment({
              name: file.name,
              mimeType: file.type || "text/plain",
              data: base64Data,
              size: file.size,
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div id="tone-panel-root" className="flex flex-col gap-6 h-full p-5 bg-white border-r border-slate-200 overflow-y-auto">
      {/* Block 1: Style configuration */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <span>Style Architect</span>
          <HelpCircle className="w-3.5 h-3.5 cursor-pointer text-slate-300 hover:text-slate-500" title="Instructs AI on how to mold the language" />
        </h3>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tone & Voice</label>
            <select
              value={toneContext.tone}
              onChange={(e) => handleContextChange("tone", e.target.value)}
              className="w-full text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 outline-none rounded-lg p-2 transition-all cursor-pointer"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Target Audience</label>
            <select
              value={toneContext.audience}
              onChange={(e) => handleContextChange("audience", e.target.value)}
              className="w-full text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 outline-none rounded-lg p-2 transition-all cursor-pointer"
            >
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Document Goal</label>
            <select
              value={toneContext.goal}
              onChange={(e) => handleContextChange("goal", e.target.value)}
              className="w-full text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 outline-none rounded-lg p-2 transition-all cursor-pointer"
            >
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Block 2: File Attachments */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <span>References & Attachments</span>
          <span className="text-[10px] lowercase px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-normal">
            {attachments.length} file{attachments.length !== 1 && "s"}
          </span>
        </h3>

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-4 border border-dashed rounded-xl transition-all ${
            dragActive ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-slate-300 bg-slate-50"
          }`}
        >
          <input
            id="file-attachment-input"
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,text/*,application/pdf"
          />
          <label htmlFor="file-attachment-input" className="flex flex-col items-center gap-2 cursor-pointer w-full text-center">
            <FileUp className="w-6 h-6 text-slate-400" />
            <span className="text-xs text-slate-500">
              Drag files here or <span className="text-sky-600 font-medium">browse</span>
            </span>
            <span className="text-[10px] text-slate-400">Images, Text notes, or PDFs</span>
          </label>
        </div>

        {attachments.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
            {attachments.map((file) => (
              <div key={file.name} className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg text-xs">
                <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate font-medium text-slate-700">{file.name}</span>
                </div>
                <button
                  onClick={() => onRemoveAttachment(file.name)}
                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Block 3: Generational Spark (Blank Start or full restructure) */}
      <div className="flex flex-col gap-3 mt-auto">
        {!hasDocumentContent ? (
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Let's collaborate on a piece</span>
            </h4>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Describe what you want to write. You can write outlines, characters, concepts, or attach notes above to weave them in!
            </p>
            <textarea
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              placeholder="e.g. Write a mystery story introduction starting with a strange package delivered under a solar eclipse..."
              className="w-full text-xs h-28 p-2.5 border border-slate-200 hover:border-slate-300 rounded-lg outline-none bg-slate-50 focus:bg-white focus:border-sky-500 transition-all resize-none mb-3"
            />
            <button
              onClick={onGenerateInitial}
              disabled={isGeneratingInitial || !initialPrompt.trim()}
              className="w-full justify-center flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-medium text-xs shadow-sm hover:shadow active:scale-[0.98] transition-all"
            >
              {isGeneratingInitial ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Drafting Content...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Draft Initial Block</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <span>Document Loaded</span>
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Your document is active. AI is acting as an inline helper. Highlight blocks, edit directly, or consult the proactive suggestions!
            </p>
            <button
              id="clear-document-btn"
              onClick={onClearDocument}
              className="w-full text-center py-1 px-3 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Reset / Start New Draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
