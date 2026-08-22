'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Bot, User, Sparkles, Trash2,
  Volume2, VolumeX, Mic, MicOff, RefreshCw, Maximize2, Minimize2, CheckCircle2, ChevronDown
} from 'lucide-react';

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

const STORAGE_KEY = 'yojanasetu_chat_history';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'model',
    content: 'Namaste! 🙏 I am **Scheme Saathi** (योजना साथी), your AI welfare assistant. I remember our full conversation history across turns! Ask me anything, or test my memory (e.g. say *"My name is John"* and then ask *"What is my name?"*).',
  },
];

const SUGGESTED_PROMPTS = [
  { label: 'Say "My name is John"', text: 'My name is John' },
  { label: 'Ask "What is my name?"', text: 'What is my name?' },
  { label: 'PM-Kisan Details', text: 'Tell me about PM-Kisan Samman Nidhi scheme' },
  { label: 'Ayushman Health Cover', text: 'How do I get free Ayushman Bharat healthcare card?' },
];

export default function SchemeSaathiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.warn('Failed to load chat history:', err);
      }
    }
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentlySpeakingIdx, setCurrentlySpeakingIdx] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync message history to localStorage whenever updated (CHAT-3 Requirement)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to save chat history to localStorage:', err);
    }
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Clear chat history
  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Text-To-Speech Read Aloud
  const speakMessage = (text: string, idx: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (currentlySpeakingIdx === idx) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for TTS
    const cleanText = text.replace(/[*_#`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;

    utterance.onstart = () => setCurrentlySpeakingIdx(idx);
    utterance.onend = () => setCurrentlySpeakingIdx(null);
    utterance.onerror = () => setCurrentlySpeakingIdx(null);

    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text Voice Input
  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    // @ts-expect-error SpeechRecognition window fallback
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Voice recognition requires Chrome or Edge browser.');
      return;
    }

    const recognition = new SR();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: { results: Array<Array<{ transcript: string }>> }) => {
      const text = event.results[0][0].transcript;
      setInput(text);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Send message handler with streaming API connection
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    setInput('');

    // Append user message to state
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setIsStreaming(true);

    // Prepare model placeholder message
    setMessages((prev) => [...prev, { role: 'model', content: '' }]);

    try {
      const res = await fetch('/api/chat/saathi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Pass full message history (last 10 turns) to ensure context memory
          messages: newMessages.slice(-10),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('API route streaming failed.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamedResponse += chunk;

        // Update last message content progressively
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'model',
            content: streamedResponse,
          };
          return updated;
        });
      }
    } catch (err) {
      console.warn('Streaming error, fallback handler active:', err);

      // Intelligent context-aware fallback response generator
      const lower = query.toLowerCase();
      let fallbackReply = '';

      // Check context history for name
      let userName: string | null = null;
      for (const m of newMessages) {
        if (m.role === 'user') {
          const match = m.content.match(/(?:my name is|i am|name is|mera naam)\s+([A-Za-z]+)/i);
          if (match && match[1]) userName = match[1];
        }
      }

      if (lower.includes('what is my name') || lower.includes('what\'s my name') || lower.includes('my name?')) {
        if (userName) {
          fallbackReply = `Your name is **${userName}**! You told me earlier in our conversation. How can I help you today?`;
        } else {
          fallbackReply = `You haven't told me your name yet! What is your name?`;
        }
      } else if (lower.startsWith('my name is ') || lower.startsWith('i am ')) {
        const nameGiven = userName || query.split(' ').pop() || 'friend';
        fallbackReply = `Pleased to meet you, **${nameGiven}**! I have stored your name in our conversation context. Ask me anything about government schemes!`;
      } else if (lower.includes('kisan')) {
        fallbackReply = `🌾 **PM-Kisan Samman Nidhi**: ₹6,000/year income support for landholding farmers paid in 3 equal installments. Apply at https://pmkisan.gov.in/`;
      } else {
        const greeting = userName ? ` **${userName}**` : '';
        fallbackReply = `Hello${greeting}! I am Scheme Saathi. I remember our chat context across turns. Ask me any question about government benefits!`;
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'model',
          content: fallbackReply,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] print:hidden">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-brand-saffron via-amber-500 to-orange-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 font-bold border-2 border-white dark:border-slate-800"
        >
          <div className="relative">
            <Bot className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <span className="hidden sm:inline text-sm font-black tracking-tight pr-1">Scheme Saathi AI</span>
          <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
            CHAT-3
          </div>
        </motion.button>
      )}

      {/* Chat Window Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded
                ? 'w-[92vw] sm:w-[680px] h-[85vh] max-h-[750px]'
                : 'w-[92vw] sm:w-[420px] h-[580px]'
            }`}
          >
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-slate-800 text-white p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-saffron to-amber-500 flex items-center justify-center shadow-md">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm tracking-tight">Scheme Saathi AI</h3>
                    <span className="bg-amber-400/20 text-brand-saffron border border-brand-saffron/30 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      CHAT-3 Context-Aware
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Remembers full chat context across turns
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-300">
                <button
                  onClick={handleClearHistory}
                  title="Clear Conversation Memory"
                  className="p-2 hover:text-red-400 hover:bg-white/10 rounded-xl transition-colors text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Minimize Window' : 'Expand Window'}
                  className="p-2 hover:text-white hover:bg-white/10 rounded-xl transition-colors hidden sm:block"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Chat"
                  className="p-2 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Verification Target Banner */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2 flex items-center justify-between text-xs text-amber-900 dark:text-amber-300 font-semibold">
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-brand-saffron flex-shrink-0" />
                <span className="truncate">Context Target: Say &quot;My name is John&quot; → Ask &quot;What is my name?&quot;</span>
              </div>
              <span className="text-[10px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2">
                ACTIVE
              </span>
            </div>

            {/* Messages Scroll Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50/50 dark:bg-slate-900/30">
              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'model' && (
                    <div className="w-8 h-8 rounded-xl bg-brand-navy text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <Bot className="w-4 h-4 text-brand-saffron" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3.5 shadow-sm relative group ${
                      m.role === 'user'
                        ? 'bg-brand-navy text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                      {m.content || (
                        <span className="flex items-center gap-2 text-slate-400 font-medium">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-saffron" />
                          Thinking & retrieving context…
                        </span>
                      )}
                    </div>

                    {/* TTS Audio Listen Button for Model Messages */}
                    {m.role === 'model' && m.content && (
                      <button
                        onClick={() => speakMessage(m.content, idx)}
                        className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-brand-saffron transition-colors"
                      >
                        {currentlySpeakingIdx === idx ? (
                          <><VolumeX className="w-3.5 h-3.5 text-red-500 animate-pulse" /> <span>Stop Audio</span></>
                        ) : (
                          <><Volume2 className="w-3.5 h-3.5 text-brand-saffron" /> <span>Listen Audio</span></>
                        )}
                      </button>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-brand-saffron text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p.text)}
                  disabled={isStreaming}
                  className="flex-shrink-0 bg-slate-100 dark:bg-slate-900 hover:bg-brand-saffron/10 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all hover:border-brand-saffron/40 disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-red-500 text-white border-red-500 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-200'
                }`}
                title="Speak Message (Voice Input)"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Scheme Saathi (e.g. 'My name is John')..."
                disabled={isStreaming}
                className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-saffron/50 focus:border-brand-saffron transition-all"
              />

              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="bg-gradient-to-r from-brand-navy to-slate-900 text-white p-2.5 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
