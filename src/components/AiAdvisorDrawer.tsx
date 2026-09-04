import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Cpu, 
  HelpCircle, 
  ArrowRight,
  RotateCcw,
  Check
} from 'lucide-react';

interface AiAdvisorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiAdvisorDrawer: React.FC<AiAdvisorDrawerProps> = ({ isOpen, onClose, initialPrompt }) => {
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am **CorePick AI Infrastructure Advisor**. 

I can help you determine:
* Which accelerator (NVIDIA H100, B200, AMD MI300X, Apple Silicon) is best for your specific model and latency budget.
* Why your workload is memory-bandwidth bound vs compute bound.
* What performance gain and accuracy tradeoff to expect when switching from FP16 to FP8 or INT4.
* How to size Tensor Parallelism across multi-GPU nodes.

Ask a question or select a prompt below!`,
      timestamp: 'Now'
    }
  ]);

  useEffect(() => {
    if (initialPrompt) {
      setInputQuery(initialPrompt);
    }
  }, [initialPrompt]);

  if (!isOpen) return null;

  const handleSendMessage = async (promptToSend?: string) => {
    const query = promptToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: 'General AI Workload',
          targetHardware: 'NVIDIA / AMD / Apple / TPU Clusters',
          userPrompt: query,
        })
      });
      const data = await res.json();

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'Analysis completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to connect to CorePick AI Advisor backend. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Which GPU should I use for Llama-3 70B?',
    'Why is B200 faster than H100 for decode?',
    'What happens if I quantize to FP8?',
    'Why am I memory-bandwidth bound?',
    'How many GPUs do I need for 100 concurrent users?',
    'How can I cut my monthly inference cost by 50%?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#0A0D14] border-l border-[#1E293B] flex flex-col h-full shadow-2xl animate-slideLeft">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0D1322]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-white">CorePick AI Infrastructure Advisor</h2>
              <span className="text-[10px] font-mono text-cyan-400">Deep Learning Compiler & GPU Architect</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E293B] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs font-mono ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-[#0D1322] border border-[#1E293B] text-slate-200 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 text-xs font-mono items-center text-slate-400">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <span>Analyzing infrastructure mathematical rooflines...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Chips */}
        <div className="p-3 border-t border-[#1E293B] bg-[#07090E] overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-[#0D1322] hover:bg-[#131B2E] text-slate-300 hover:text-cyan-300 border border-[#27354F] transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="p-3.5 border-t border-[#1E293B] bg-[#0D1322]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about GPUs, memory bandwidth, or quantization..."
              className="flex-1 bg-[#07090E] border border-[#27354F] rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
