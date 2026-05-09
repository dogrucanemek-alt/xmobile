const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/ai`;
const CHAT_URL = `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/chat`;

export type TaskType = 'general' | 'marketing' | 'sales' | 'code' | 'architecture' | 'document';
export type CompanyKey = 'dogrucan' | 'ai_furniture' | 'core';
export type ProviderKey = 'openai' | 'anthropic';

export interface AIRequest {
  taskType: TaskType;
  company: CompanyKey;
  message: string;
  provider?: ProviderKey;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  provider: ProviderKey;
  model: string;
  taskType: TaskType;
  company: CompanyKey;
  usage?: { input_tokens: number; output_tokens: number };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  company: CompanyKey;
  taskType?: TaskType;
  sessionId?: string;
}

export interface ChatResponse {
  content: string;
  provider: ProviderKey;
  model: string;
  taskType: TaskType;
  company: CompanyKey;
  sessionId?: string;
}

export async function chatJarvis(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const hata = await res.text();
    throw new Error(`Jarvis hatası (${res.status}): ${hata.slice(0, 200)}`);
  }

  return res.json() as Promise<ChatResponse>;
}

export async function sorAI(request: AIRequest): Promise<AIResponse> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const hata = await res.text();
    throw new Error(`AI hatası (${res.status}): ${hata.slice(0, 200)}`);
  }

  return res.json() as Promise<AIResponse>;
}
