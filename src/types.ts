export interface ParagraphBlock {
  id: string;
  text: string;
  originalText?: string;
  hasSuggestion?: boolean;
  suggestionText?: string;
  suggestionPrompt?: string;
  suggestionReason?: string;
  isGenerating?: boolean;
}

export interface CopilotSuggestion {
  id: string;
  blockId: string;
  type: 'style' | 'grammar' | 'structure' | 'engagement' | 'clarity';
  title: string;
  description: string;
  originalText: string;
  suggestedText: string;
  applied: boolean;
  dismissed: boolean;
}

export interface AttachmentFile {
  name: string;
  mimeType: string;
  data: string; // base64 encoded
  size: number;
}

export interface ToneContext {
  tone: string;       // e.g. "Creative", "Academic", "Suspenseful", "Business Professional", "Casual"
  audience: string;   // e.g. "General Readers", "Experts", "Kids", "Inspirers"
  goal: string;       // e.g. "Educate", "Persuade", "Entertain", "Hook"
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface DocumentDraft {
  id: string;
  title: string;
  blocks: ParagraphBlock[];
  tone: ToneContext;
  attachments: AttachmentFile[];
  updatedAt: string;
}
