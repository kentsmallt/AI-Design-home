import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, ShoppingBag } from 'lucide-react';
import { Message, MessageRole } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-[500px] md:h-[600px] bg-white rounded-xl shadow-lg border border-stone-200">
      <div className="p-4 border-b border-stone-100 bg-stone-50 rounded-t-xl flex justify-between items-center">
        <h2 className="font-semibold text-stone-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Design Assistant
        </h2>
        <span className="text-xs text-stone-500 px-2 py-1 bg-stone-200 rounded-full">Gemini 3 Pro</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-stone-400 mt-20 px-6">
            <p>Ask me to refine the design or find items to buy!</p>
            <p className="text-sm mt-2 italic">"Where can I buy that rug?"</p>
            <p className="text-sm italic">"Make the walls sage green."</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === MessageRole.USER 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-stone-100 text-stone-800 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-300/50">
                  <p className="text-xs font-semibold mb-1 flex items-center gap-1 opacity-70">
                    <ShoppingBag size={12} /> Sources & Links
                  </p>
                  <ul className="space-y-1">
                    {msg.sources.map((source, idx) => (
                      <li key={idx}>
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-500 hover:text-indigo-700 underline truncate block max-w-full"
                        >
                          {source.title || source.uri}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
              <span className="text-xs text-stone-500">Thinking & Designing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-stone-100 bg-white rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe changes or ask about items..."
            className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};
