import React, { useState, useEffect, useCallback, useRef } from "react";
import { ParagraphBlock, ToneContext, AttachmentFile, CopilotSuggestion, ChatMessage } from "./types";
import TonePanel from "./components/TonePanel";
import DocumentEditor from "./components/DocumentEditor";
import CopilotPanel from "./components/CopilotPanel";
import { Sparkles, Brain, Edit3, HelpCircle, Loader2, BookOpen, Settings } from "lucide-react";

const DEMO_BLOCKS: ParagraphBlock[] = [
  {
    id: "demo_1",
    text: "The delivery van arrived exactly three minutes before the solar eclipse was scheduled to begin, the paint on its sides peeling like dried birch bark under the afternoon heat. A solitary, unlabelled cedar chest was dropped on the front porch with a heavy thud, vibrating the glass panes of the front entryway.",
  },
  {
    id: "demo_2",
    text: "There was no postage mark, nor any indication of a return sender. Just a thin brass padlock clinging to its latch, cold as frozen lake water despite the ambient glow of the summer zenith.",
  },
  {
    id: "demo_3",
    text: "The street outside was perfectly still. Neighbors had gathered three blocks away with plastic protective glasses squinted skyward, but here under the dark foliage of the maple trees, other eyes were fixed purely on the lock.",
  }
];

export default function App() {
  // Document State
  const [blocks, setBlocks] = useState<ParagraphBlock[]>(() => {
    const saved = localStorage.getItem("magic_writer_blocks");
    return saved ? JSON.parse(saved) : DEMO_BLOCKS;
  });

  const [toneContext, setToneContext] = useState<ToneContext>(() => {
    const saved = localStorage.getItem("magic_writer_tone");
    return saved ? JSON.parse(saved) : {
      tone: "Creative & Poetic",
      audience: "General Readers",
      goal: "Entertain & Immersive",
    };
  });

  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>(() => {
    const saved = localStorage.getItem("magic_writer_suggestions");
    return saved ? JSON.parse(saved) : [];
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("magic_writer_chat");
    return saved ? JSON.parse(saved) : [];
  });

  const [proactiveMode, setProactiveMode] = useState(true);

  // Loading States
  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  
  // Proactive analysis feedback trigger states
  const [autosaveNotification, setAutosaveNotification] = useState<string | null>(null);

  // Refs for tracking background analysis timeouts
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. LocalStorage Persistence
  useEffect(() => {
    localStorage.setItem("magic_writer_blocks", JSON.stringify(blocks));
  }, [blocks]);

  useEffect(() => {
    localStorage.setItem("magic_writer_tone", JSON.stringify(toneContext));
  }, [toneContext]);

  useEffect(() => {
    localStorage.setItem("magic_writer_suggestions", JSON.stringify(suggestions));
  }, [suggestions]);

  useEffect(() => {
    localStorage.setItem("magic_writer_chat", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Primitive value used to detect text change size for debounced Proactive scan
  const currentTextSize = blocks.map(b => b.text).join("|").length;

  // 2. Proactive AI background critique trigger trigger
  useEffect(() => {
    if (!proactiveMode || blocks.length === 0) return;

    // Detect pauses in writing (e.g., 8 seconds since final typed character) to trigger background critique
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      triggerBackgroundAnalysis();
    }, 8000);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [currentTextSize, proactiveMode]);

  const triggerBackgroundAnalysis = async () => {
    if (isAnalyzing) return;
    setAutosaveNotification("Analyzing draft structure in background...");
    try {
      const response = await fetch("/api/suggest-improvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: blocks.map(b => ({ id: b.id, text: b.text })),
          tone: toneContext.tone,
          audience: toneContext.audience,
          goal: toneContext.goal,
        }),
      });

      if (!response.ok) throw new Error("Could not acquire passive suggestions.");
      const data = await response.json();
      
      if (data.suggestions && Array.isArray(data.suggestions)) {
        // Map new suggestions
        const newSuggestions: CopilotSuggestion[] = data.suggestions.map((s: any) => ({
          id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          blockId: s.blockId,
          type: s.type,
          title: s.title,
          description: s.description,
          originalText: s.originalTextSnippet || "",
          suggestedText: s.suggestedText || "",
          applied: false,
          dismissed: false,
        }));

        setSuggestions(() => newSuggestions);
        setAutosaveNotification("Smart Coach insights updated!");
        setTimeout(() => setAutosaveNotification(null), 3000);
      }
    } catch (e) {
      console.warn("Passive background critique skipped: ", e);
      setAutosaveNotification(null);
    }
  };

  const handleManualAnalyze = async () => {
    setIsAnalyzing(true);
    setAutosaveNotification("Critiqueing document layout...");
    try {
      const response = await fetch("/api/suggest-improvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: blocks.map(b => ({ id: b.id, text: b.text })),
          tone: toneContext.tone,
          audience: toneContext.audience,
          goal: toneContext.goal,
        }),
      });

      if (!response.ok) throw new Error("Critique connection failed.");
      const data = await response.json();

      if (data.suggestions && Array.isArray(data.suggestions)) {
        const mapped: CopilotSuggestion[] = data.suggestions.map((s: any) => ({
          id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          blockId: s.blockId,
          type: s.type,
          title: s.title,
          description: s.description,
          originalText: s.originalTextSnippet || "",
          suggestedText: s.suggestedText || "",
          applied: false,
          dismissed: false,
        }));
        setSuggestions(mapped);
      }
      setAutosaveNotification("Insights generated successfully.");
      setTimeout(() => setAutosaveNotification(null), 3000);
    } catch (e: any) {
      alert(`Error during edit checks: ${e.message}`);
      setAutosaveNotification(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Document operations
  const handleUpdateBlockText = (id: string, text: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, text } : b))
    );
  };

  const handleAddBlock = (index: number) => {
    const newId = `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newBlock: ParagraphBlock = {
      id: newId,
      text: "",
    };
    setBlocks((prev) => {
      const copy = [...prev];
      copy.splice(index, 0, newBlock);
      return copy;
    });
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleClearDocument = () => {
    if (confirm("Are you sure you want to reset this document? This will clear all active paragraphs, reference files, and suggestions.")) {
      setBlocks([]);
      setSuggestions([]);
      setAttachments([]);
      setInitialPrompt("");
      setChatHistory([]);
      localStorage.removeItem("magic_writer_blocks");
      localStorage.removeItem("magic_writer_suggestions");
      localStorage.removeItem("magic_writer_chat");
    }
  };

  // 4. Initial Generating Studio
  const handleGenerateInitial = async () => {
    if (!initialPrompt.trim()) return;
    setIsGeneratingInitial(true);
    try {
      const response = await fetch("/api/generate-initial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: initialPrompt,
          tone: toneContext.tone,
          audience: toneContext.audience,
          goal: toneContext.goal,
          attachments: attachments,
        }),
      });

      if (!response.ok) throw new Error("Generative backend failed to reply.");
      const data = await response.json();

      if (data.paragraphs && Array.isArray(data.paragraphs)) {
        const constructedBlocks: ParagraphBlock[] = data.paragraphs.map((p: string, i: number) => ({
          id: `block_${Date.now()}_${i}`,
          text: p,
        }));
        setBlocks(constructedBlocks);
        setInitialPrompt("");
      }
    } catch (error: any) {
      alert(`Could not draft initial block: ${error.message}`);
    } finally {
      setIsGeneratingInitial(false);
    }
  };

  // 5. In-line Iterative Generation
  const handleIterateBlock = async (id: string, feedback: string) => {
    // Set target block to generating loading sequence
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isGenerating: true } : b))
    );

    try {
      const blockIdx = blocks.findIndex((b) => b.id === id);
      const targetBlock = blocks[blockIdx];

      const beforeContext = blockIdx > 0 ? blocks[blockIdx - 1].text : null;
      const afterContext = blockIdx < blocks.length - 1 ? blocks[blockIdx + 1].text : null;

      const response = await fetch("/api/iterate-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockText: targetBlock.text,
          userFeedback: feedback,
          beforeContext,
          afterContext,
          tone: toneContext.tone,
          audience: toneContext.audience,
          goal: toneContext.goal,
        }),
      });

      if (!response.ok) throw new Error("Model feedback iteration failed.");
      const data = await response.json();

      if (data.text) {
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  originalText: b.text,
                  suggestionText: data.text,
                  suggestionPrompt: feedback,
                  suggestionReason: data.explanation,
                  isGenerating: false,
                }
              : b
          )
        );
      }
    } catch (error: any) {
      alert(`Could not rewrite paragraph: ${error.message}`);
      setBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isGenerating: false } : b))
      );
    }
  };

  const handleAcceptSuggestion = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === id && b.suggestionText) {
          return {
            ...b,
            text: b.suggestionText,
            originalText: undefined,
            suggestionText: undefined,
            suggestionPrompt: undefined,
            suggestionReason: undefined,
          };
        }
        return b;
      })
    );
  };

  const handleRejectSuggestion = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              originalText: undefined,
              suggestionText: undefined,
              suggestionPrompt: undefined,
              suggestionReason: undefined,
            }
          : b
      )
    );
  };

  // Applying suggestions generated proactively
  const handleApplyStyleSuggestion = (s: CopilotSuggestion) => {
    // Push the suggestion right into the specific target block context
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === s.blockId
          ? {
              ...b,
              originalText: b.text,
              suggestionText: s.suggestedText,
              suggestionReason: s.title + ": " + s.description,
            }
          : b
      )
    );

    // Update suggestions cache applied status
    setSuggestions((prev) =>
      prev.map((item) => (item.id === s.id ? { ...item, applied: true } : item))
    );
  };

  const handleDismissSuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, dismissed: true } : item))
    );
  };

  // 6. Mentor Conversational Thread
  const handleSendChatMessage = async (msg: string) => {
    const newMessage: ChatMessage = {
      id: `chat_${Date.now()}`,
      role: "user",
      text: msg,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatHistory((prev) => [...prev, newMessage]);
    setIsSendingChatMessage(true);

    try {
      const response = await fetch("/api/chat-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          chatHistory: chatHistory,
          blocks: blocks.map((b) => ({ text: b.text })),
          tone: toneContext.tone,
          audience: toneContext.audience,
          goal: toneContext.goal,
        }),
      });

      if (!response.ok) throw new Error("Mentor has gone silent.");
      const data = await response.json();

      if (data.text) {
        const reply: ChatMessage = {
          id: `chat_${Date.now()}_reply`,
          role: "model",
          text: data.text,
          timestamp: new Date().toLocaleTimeString(),
        };
        setChatHistory((prev) => [...prev, reply]);
      }
    } catch (e: any) {
      alert(`Writing Mentor status offline: ${e.message}`);
    } finally {
      setIsSendingChatMessage(false);
    }
  };

  return (
    <div id="app-main-view" className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Visual Navigation Bar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-sky-600 p-2 rounded-xl text-white shadow-sm flex items-center justify-center">
            <Sparkles className="w-5 h-5 fill-current animate-pulse text-yellow-300" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Magic Writing Experience</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400">AI-Powered Distraction-Free Co-Writing Studio</p>
          </div>
        </div>

        {/* Global real-time coaching prompt notification bar */}
        {autosaveNotification && (
          <div className="hidden md:flex items-center gap-2 bg-sky-50 text-sky-700 font-semibold text-xs px-3 py-1.5 rounded-full border border-sky-100 animate-fade-in animate-pulse">
            <Brain className="w-3.5 h-3.5 text-sky-500" />
            <span>{autosaveNotification}</span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="text-[10px] font-mono text-slate-400">
            <span>Server Side Gemini Active</span>
          </div>
        </div>
      </header>

      {/* Main Studio Frame Layout */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left pane: Style settings & Initial drafting prompt */}
        <aside className="w-full lg:w-80 shrink-0 h-1/3 lg:h-full border-b lg:border-b-0">
          <TonePanel
            toneContext={toneContext}
            setToneContext={setToneContext}
            attachments={attachments}
            onAddAttachment={(f) => setAttachments((prev) => [...prev, f])}
            onRemoveAttachment={(n) => setAttachments((prev) => prev.filter((a) => a.name !== n))}
            initialPrompt={initialPrompt}
            setInitialPrompt={setInitialPrompt}
            onGenerateInitial={handleGenerateInitial}
            isGeneratingInitial={isGeneratingInitial}
            hasDocumentContent={blocks.length > 0}
            onClearDocument={handleClearDocument}
          />
        </aside>

        {/* Center Canvas: Scrollable document editor workspace */}
        <main className="flex-1 h-2/3 lg:h-full relative overflow-hidden flex flex-col">
          <DocumentEditor
            blocks={blocks}
            onUpdateBlockText={handleUpdateBlockText}
            onAddBlock={handleAddBlock}
            onRemoveBlock={handleRemoveBlock}
            onIterateBlock={handleIterateBlock}
            onAcceptSuggestion={handleAcceptSuggestion}
            onRejectSuggestion={handleRejectSuggestion}
            activeTone={toneContext}
          />
        </main>

        {/* Right Pane: Smart Proactive Editorial sidebar & brainstorming advisor chat */}
        <section className="w-full lg:w-96 border-t lg:border-t-0 shrink-0 h-1/3 lg:h-full">
          <CopilotPanel
            suggestions={suggestions}
            onApplyStyleSuggestion={handleApplyStyleSuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onAnalyzeDraft={handleManualAnalyze}
            isAnalyzing={isAnalyzing}
            chatHistory={chatHistory}
            onSendChatMessage={handleSendChatMessage}
            isSendingChatMessage={isSendingChatMessage}
            proactiveMode={proactiveMode}
            setProactiveMode={setProactiveMode}
          />
        </section>
      </div>
    </div>
  );
}
