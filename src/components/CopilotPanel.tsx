import React, { useState } from "react";
import { CopilotSuggestion, ChatMessage } from "../types";
import { Sparkles, Brain, Check, MessageSquare, AlertCircle, Zap, Send, Loader2, ArrowRightLeft, Sparkle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CopilotPanelProps {
  suggestions: CopilotSuggestion[];
  onApplyStyleSuggestion: (s: CopilotSuggestion) => void;
  onDismissSuggestion: (id: string) => void;
  onAnalyzeDraft: () => void;
  isAnalyzing: boolean;
  chatHistory: ChatMessage[];
  onSendChatMessage: (msg: string) => void;
  isSendingChatMessage: boolean;
  proactiveMode: boolean;
  setProactiveMode: (v: boolean) => void;
}

export default function CopilotPanel({
  suggestions,
  onApplyStyleSuggestion,
  onDismissSuggestion,
  onAnalyzeDraft,
  isAnalyzing,
  chatHistory,
  onSendChatMessage,
  isSendingChatMessage,
  proactiveMode,
  setProactiveMode,
}: CopilotPanelProps) {
  const [activeTab, setActiveTab] = useState<"coach" | "mentor">("coach");
  const [mentorInput, setMentorInput] = useState("");

  const handleSendChat = () => {
    if (!mentorInput.trim()) return;
    onSendChatMessage(mentorInput);
    setMentorInput("");
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "style":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "grammar":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "structure":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "engagement":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default:
        return "bg-sky-50 text-sky-700 border-sky-100";
    }
  };

  const activeSuggestions = suggestions.filter((s) => !s.applied && !s.dismissed);

  return (
    <div id="copilot-panel-root" className="flex flex-col gap-0 h-full w-full bg-slate-50 border-l border-slate-200">
      {/* Panel Navigation Tabs */}
      <div className="flex bg-white border-b border-slate-200">
        <button
          onClick={() => setActiveTab("coach")}
          className={`flex-1 py-3 px-4 text-xs font-semibold uppercase tracking-wider text-center flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "coach" ? "border-sky-600 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Brain className="w-4 h-4 text-sky-500" />
          <span>Proactive Coach</span>
        </button>
        <button
          onClick={() => setActiveTab("mentor")}
          className={`flex-1 py-3 px-4 text-xs font-semibold uppercase tracking-wider text-center flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "mentor" ? "border-sky-600 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-indigo-505" />
          <span>Writing Mentor</span>
        </button>
      </div>

      {/* Tab Panel Viewports */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeTab === "coach" ? (
          <div className="flex flex-col gap-4 h-full">
            {/* Header Toolbelt */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-slate-700">Proactive Critique Agent</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={proactiveMode}
                    onChange={(e) => setProactiveMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sky-600"></div>
                  <span className="ml-1.5 text-[10px] font-medium text-slate-500">
                    {proactiveMode ? "Proactive ON" : "Proactive OFF"}
                  </span>
                </label>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Analyze your drafting flow. The AI critiques sentence length, emotional hooks, active voice, and layout density instantly.
              </p>
              <button
                onClick={onAnalyzeDraft}
                disabled={isAnalyzing}
                className="w-full justify-center flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Critiqueing Draft...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-Analyze Draft</span>
                  </>
                )}
              </button>
            </div>

            {/* Suggestions Pipeline */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 font-sans tracking-wide">
                Active Improvement Cards ({activeSuggestions.length})
              </h4>

              {activeSuggestions.length === 0 ? (
                <div className="text-center p-8 bg-white border border-dashed border-slate-200 rounded-xl text-slate-400">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No Editorial Insights Yet</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto mt-1">
                    {proactiveMode
                      ? "Write a few sentences and our coach will automatically surface improvements!"
                      : "Turn on Proactive mode or click Analyze Draft to start receiving insights."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 overflow-y-auto">
                  {activeSuggestions.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 flex flex-col gap-2.5 transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBadgeColor(s.type)} uppercase`}>
                          {s.type}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onDismissSuggestion(s.id)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-xs font-semibold text-slate-800 leading-snug">{s.title}</h5>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{s.description}</p>
                      </div>

                      {/* Snippet Block comparison */}
                      <div className="bg-slate-50 rounded-lg p-2 flex flex-col gap-1.5 border border-slate-100 text-xs">
                        <div className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <span className="line-through">Original Snippet</span>
                        </div>
                        <p className="font-serif italic text-slate-500 line-through leading-relaxed max-h-12 overflow-y-auto">
                          "{s.originalText}"
                        </p>

                        <div className="border-t border-dashed border-slate-200 my-1"></div>

                        <div className="text-[9px] uppercase font-bold text-sky-600 flex items-center gap-1">
                          <span>Suggested Rewrite</span>
                        </div>
                        <p className="font-serif text-slate-800 leading-relaxed max-h-20 overflow-y-auto font-medium">
                          "{s.suggestedText}"
                        </p>
                      </div>

                      {/* Quick apply */}
                      <button
                        onClick={() => onApplyStyleSuggestion(s)}
                        className="w-full flex items-center justify-center gap-1 py-1.5 bg-sky-900 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow hover:shadow-md cursor-pointer transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Inject into Editor</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Writing Mentor Chat Panel */
          <div className="flex flex-col h-full min-h-[50vh]">
            <div className="flex-1 overflow-y-auto mb-3 flex flex-col gap-2 p-1 border border-slate-200 rounded-xl bg-white max-h-[50vh]">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 my-auto">
                  <Brain className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Consult your Mentor</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mt-1">
                    Ask questions, design transitions, request character traits, outline ideas. The mentor is fully in-touch with what you write on the left canvas.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 p-2">
                  {chatHistory.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        m.role === "user"
                          ? "bg-slate-900 text-white self-end rounded-br-none"
                          : "bg-slate-100 text-slate-800 self-start rounded-bl-none border border-slate-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  ))}
                  {isSendingChatMessage && (
                    <div className="bg-slate-100 text-slate-550 border border-slate-200 self-start p-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 text-xs max-w-[85%]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mentor is thinking...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input thread bar */}
            <div className="flex gap-2 bg-white p-2 border border-slate-200 rounded-xl shrink-0">
              <input
                type="text"
                value={mentorInput}
                onChange={(e) => setMentorInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Ask me anything: outline transitions, analyze mood..."
                className="flex-1 text-xs outline-none px-2 bg-transparent"
              />
              <button
                onClick={handleSendChat}
                disabled={isSendingChatMessage || !mentorInput.trim()}
                className="p-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-lg shrink-0 cursor-pointer transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
