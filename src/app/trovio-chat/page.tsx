"use client";

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function TrovioChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      const res = await fetch('/api/trovio-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: userMessage }] })
      });
      const data = await res.json();
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "I was unable to produce a text response." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${(error as Error).message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-4 font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel {
          font-family: 'Press Start 2P', 'Fira Mono', monospace;
        }
      `}</style>
      <div className="w-full max-w-2xl mx-auto bg-gray-900 border-2 border-purple-700 rounded-2xl shadow-lg p-6 flex flex-col h-[80vh]">
        <h1 className="text-3xl font-bold text-purple-400 font-pixel text-center mb-4">ZORA: Vault Guardian</h1>
        <div className="flex-1 overflow-y-auto bg-black/30 rounded-lg p-4 mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-4 my-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && <span className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center font-pixel text-white">Z</span>}
              <div className={`p-3 rounded-lg max-w-sm ${msg.role === 'user' ? 'bg-purple-800 text-white' : 'bg-gray-800 text-white'} font-pixel`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
              {msg.role === 'user' && <span className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center font-pixel text-white">U</span>}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-white font-pixel p-3 rounded-lg max-w-sm">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-4 mt-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message to ZORA..."
            className="flex-1 bg-gray-800 border-2 border-purple-700 rounded-lg p-3 text-white focus:ring-purple-500 focus:border-purple-500 font-pixel"
            disabled={isLoading}
          />
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg font-pixel tracking-wider" disabled={isLoading}>
            SEND
          </button>
        </form>
      </div>
    </div>
  );
} 