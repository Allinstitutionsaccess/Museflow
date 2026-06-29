import React, { useState, useRef, useEffect } from "react";
import { ParagraphBlock, ToneContext } from "../types";
import { Sparkles, Check, X, RotateCcw, AlertTriangle, Play, Flame, List, ArrowDownWideNarrow, HelpCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DocumentEditorProps {
  blocks: ParagraphBlock[];
  onUpdateBlockText: (id: string, text: string) => void;
  onAddBlock: (index: number) => void;
  onRemoveBlock: (id: string) => void;
  onIterateBlock: (id: string, feedback: string) => void;
  onAcceptSuggestion: (id: string) => void;
  onRejectSuggestion: (id: string) => void;
  activeTone: ToneContext;
}

const CONTEXT_SHORTCUTS = [
  { label: "⚡ Punchier & Shorter", feedback: "Make this paragraph significantly punchier and shorter, keeping the core message." },
  { label: "✍️ Expand & Deepen Details", feedback: "Expand this paragraph with richer descriptive imagery and sensory details." },
  { label: "🎭 Change to Drama/Suspense", feedback: "Infuse high dramatic suspense and anticipation into these words." },
  { label: "💼 Professional Editorial", feedback: "Adjust the style to sound authoritative, polished, and professionally editorial." },
];

export default function DocumentEditor({
  blocks,
  onUpdateBlockText,
  onAddBlock,
  onRemoveBlock,
  onIterateBlock,
  onAcceptSuggestion,
  onRejectSuggestion,
  activeTone,
}: DocumentEditorProps) {
  const [activeAIBlockId, setActiveAIBlockId] = useState<string | null>(null);
  const [customFeedbackMap, setCustomFeedbackMap] = useState<Record<string, string>>({});
  const listEndRef = useRef<HTMLDivElement>(null);

  // Trigger auto-resizing of textareas to fit content perfectly
  const adjustHeight = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  const handleTextareaChange = (id: string, text: string, el: HTMLTextAreaElement) => {
    onUpdateBlockText(id, text);
    adjustHeight(el);
  };

  const submitIteration = (id: string, feedback: string) => {
    if (!feedback.trim()) return;
    onIterateBlock(id, feedback);
    // Keep custom feedback map updated but focus on loading
    setCustomFeedbackMap((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div id="document-editor-root" className="flex flex-col flex-1 h-full bg-slate-50 overflow-y-auto">
      {/* Editor Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Collaborative Workspace</h2>
          <p className="text-xs text-slate-500">
            Write freely. Click <span className="font-semibold text-sky-600">Assist</span> on any paragraph to iterate, or type feedback inline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 bg-sky-50 text-sky-700 font-medium rounded-full flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>Tone: {activeTone.tone}</span>
          </span>
          <span className="text-xs text-slate-400">
            {blocks.length} block{blocks.length !== 1 && "s"}
          </span>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="flex-1 px-8 py-8 md:px-16 lg:px-24">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-[60vh] text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl max-w-2xl mx-auto p-8">
            <Sparkles className="w-10 h-10 text-slate-300 mb-3" />
            <h3 className="text-sm font-medium text-slate-700 mb-1">Your Draft is Empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
              Use the left side Style Architect to draft a beautiful start, or click the button below to add your first paragraph and write freely.
            </p>
            <button
              onClick={() => onAddBlock(0)}
              className="py-1.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-lg shadow cursor-pointer transition-all"
            >
              Add First Paragraph
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-3xl mx-auto pb-32">
            {blocks.map((block, index) => {
              const hasDraft = block.suggestionText && block.suggestionText !== block.text;

              return (
                <div
                  key={block.id}
                  className="group relative flex flex-col gap-2 p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl hover:shadow-sm transition-all"
                >
                  {/* Block Metadata / Action bar (floating on hover) */}
                  <div className="absolute top-2.5 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setActiveAIBlockId(activeAIBlockId === block.id ? null : block.id);
                      }}
                      className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                        activeAIBlockId === block.id
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-sky-500" />
                      <span>{activeAIBlockId === block.id ? "Done Assist" : "AI Assist"}</span>
                    </button>
                    <button
                      onClick={() => onAddBlock(index + 1)}
                      className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-md border border-slate-100 cursor-pointer"
                      title="Insert paragraph below"
                    >
                      +
                    </button>
                    {blocks.length > 1 && (
                      <button
                        onClick={() => onRemoveBlock(block.id)}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md border border-slate-100 cursor-pointer"
                        title="Delete paragraph"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Left Index Indicator */}
                  <span className="absolute -left-7 top-5 text-[10px] font-mono text-slate-300 group-hover:text-slate-500 transition-all select-none">
                    P{index + 1}
                  </span>

                  {/* Paragraph Textarea */}
                  <div className="relative w-full">
                    {block.isGenerating ? (
                      <div className="w-full min-h-[4rem] flex flex-col gap-2 p-1.5">
                        <div className="flex items-center gap-2 text-xs text-sky-600 bg-sky-50 p-2 rounded-lg my-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
                          <span className="font-medium animate-pulse">AI is writing & optimizing paragraph...</span>
                        </div>
                        <div className="animate-pulse flex flex-col gap-1.5">
                          <div className="h-3 bg-slate-100 rounded w-full"></div>
                          <div className="h-3 bg-slate-100 rounded w-11/12"></div>
                          <div className="h-3 bg-slate-100 rounded w-9/12"></div>
                        </div>
                      </div>
                    ) : (
                      <textarea
                        value={block.text}
                        onChange={(e) => handleTextareaChange(block.id, e.target.value, e.target)}
                        ref={(el) => adjustHeight(el)}
                        placeholder="Start typing your story here... AI is observing and will support you."
                        rows={2}
                        className="w-full text-slate-800 focus:text-slate-900 border-0 outline-none p-1.5 focus:bg-slate-50/50 rounded-lg text-sm md:text-base font-serif leading-relaxed resize-none transition-all"
                      />
                    )}
                  </div>

                  {/* Proactive / Suggested Feedback Comparison View */}
                  <AnimatePresence>
                    {hasDraft && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 border border-emerald-100 bg-emerald-50/40 rounded-xl p-3 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 font-medium px-3 py-1.5 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                            <span>AI Suggested Draft Variation:</span>
                          </div>
                          {block.suggestionReason && (
                            <span className="text-[10px] bg-sky-50 text-sky-800 rounded px-1.5 py-0.5 max-w-[200px] truncate">
                              Reason: {block.suggestionReason}
                            </span>
                          )}
                        </div>

                        {/* Combined Diff / Comparative Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Original Column */}
                          <div className="p-3 bg-slate-100/60 rounded-lg text-xs md:text-sm">
                            <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Your Selected Content</span>
                            <p className="font-serif italic text-slate-600 line-through leading-relaxed">{block.originalText || block.text}</p>
                          </div>

                          {/* Suggested Column */}
                          <div className="p-3 bg-emerald-50/80 border border-emerald-200/50 rounded-lg text-xs md:text-sm shadow-sm">
                            <span className="block text-[10px] text-emerald-600 font-bold uppercase mb-1">Inline AI Weave Suggestion</span>
                            <p className="font-serif text-slate-800 font-medium leading-relaxed">{block.suggestionText}</p>
                          </div>
                        </div>

                        {/* Action Bar for applying/declining */}
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => onRejectSuggestion(block.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Discard Changes</span>
                          </button>
                          <button
                            onClick={() => onAcceptSuggestion(block.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow hover:shadow-md cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept & Weave It!</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Inline AI Assistant Interactive Control Box */}
                  <AnimatePresence>
                    {activeAIBlockId === block.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-3"
                      >
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                          <span>How would you like to rewrite this paragraph?</span>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1.5">
                          {CONTEXT_SHORTCUTS.map((shortcut) => (
                            <button
                              key={shortcut.label}
                              onClick={() => {
                                setCustomFeedbackMap({
                                  ...customFeedbackMap,
                                  [block.id]: shortcut.feedback,
                                });
                                submitIteration(block.id, shortcut.feedback);
                              }}
                              className="text-[10px] font-medium py-1 px-2.5 bg-white border border-slate-200 hover:bg-sky-50 hover:border-sky-300 text-slate-600 hover:text-sky-700 rounded-full transition-all cursor-pointer"
                            >
                              {shortcut.label}
                            </button>
                          ))}
                        </div>

                        {/* Manual Action Form */}
                        <div className="flex gap-2.5">
                          <input
                            type="text"
                            value={customFeedbackMap[block.id] || ""}
                            onChange={(e) =>
                              setCustomFeedbackMap({
                                ...customFeedbackMap,
                                [block.id]: e.target.value,
                              })
                            }
                            onSubmit={() => submitIteration(block.id, customFeedbackMap[block.id] || "")}
                            placeholder="Type a custom correction statement (e.g. 'explain the sun using a sailing analogy')"
                            className="flex-1 text-xs border border-slate-200 hover:border-slate-300 focus:border-sky-500 bg-white placeholder-slate-400 outline-none rounded-lg p-2 transition-all"
                          />
                          <button
                            onClick={() => submitIteration(block.id, customFeedbackMap[block.id] || "")}
                            disabled={!(customFeedbackMap[block.id] || "").trim()}
                            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white hover:text-white px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1 select-none transition-all shrink-0 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Rewrite</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
        <div ref={listEndRef} />
      </div>
    </div>
  );
}
