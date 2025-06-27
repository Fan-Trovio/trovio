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

  // Helper: show ATTEMPT REJECTED if assistant message contains 'rejected' or similar
  const isAttemptRejected = (msg: string) =>
    /rejected|no moni|no money|not allowed|fail|denied|no for you/i.test(msg);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center font-sans cyberpunk-bg"
      style={{
        backgroundImage:
          `linear-gradient(rgba(168,85,247,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.08) 1px, transparent 1px)`,
        backgroundSize: '12px 12px',
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel {
          font-family: 'Press Start 2P', 'Fira Mono', monospace;
        }
        .cyberpunk-panel {
          border-radius: 18px;
          border: 2px solid #a855f7;
          background: linear-gradient(135deg, #181022 80%, #2d0a3a 100%);
        }
        .cyberpunk-input {
          background: #181022;
          border: 2px solid #a855f7;
          color: #e9d5ff;
        }
        .cyberpunk-btn {
          background: linear-gradient(90deg, #a855f7 60%, #c084fc 100%);
          color: #fff;
          border: 2px solid #c084fc;
          transition: background 0.2s;
        }
        .cyberpunk-btn:active {
          background: #7c3aed;
        }
        .cyberpunk-avatar {
          background: linear-gradient(135deg, #a855f7 60%, #c084fc 100%);
          border: 3px solid #c084fc;
        }
        .cyberpunk-bubble {
          background: #232136;
          border: 2px solid #a855f7;
          color: #e9d5ff;
        }
        .cyberpunk-bubble-user {
          background: #3b0764;
          border: 2px solid #c084fc;
          color: #fff;
        }
        .cyberpunk-reject {
          background: linear-gradient(90deg, #a855f7 60%, #c084fc 100%);
          color: #fff;
          border: 3px solid #c084fc;
          font-size: 1.3rem;
          font-family: 'Press Start 2P', 'Fira Mono', monospace;
          border-radius: 12px;
          padding: 0.7rem 2.5rem;
          margin-top: 0.5rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: inline-block;
        }
      `}</style>
      {/* Main Centered Container */}
      <div className="flex flex-row gap-10 items-stretch justify-center max-w-6xl w-full px-4 glassmorph-container">
        {/* Left Panel */}
        <div className="w-80 flex flex-col items-center py-12 px-6 cyberpunk-panel relative h-full min-h-[500px]">
          <div className="text-3xl font-extrabold text-purple-400 font-pixel mb-2 tracking-widest text-center">
            TROVIO VAULT
          </div>
          <div className="text-purple-200 text-lg font-pixel mb-8 text-center tracking-wide">
            Wanna grab some prize ?
          </div>
          <div className="bg-black/80 border-2 border-purple-700 rounded-2xl p-6 mb-8 w-full flex flex-col items-center">
            <div className="text-4xl font-bold text-purple-300 font-pixel mb-2">$1,000</div>
            <div className="text-purple-400 font-pixel text-xs mb-4 uppercase tracking-widest">In Price Pool</div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex justify-between text-purple-300 font-pixel text-sm">
                <span>MESSAGE PRICE</span>
                <span className="text-purple-100">$12</span>
              </div>
              <div className="flex justify-between text-purple-300 font-pixel text-sm">
                <span>TOTAL ATTEMPTS</span>
                <span className="text-purple-100">11</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full mt-6">
              <div className="flex justify-between text-xs text-purple-300 font-pixel mb-1">
                <span>Progress</span>
                <span>0%</span>
              </div>
              <div className="w-full h-2 bg-purple-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col items-center justify-center mt-18">
          {/* Top Title */}
          <div className="w-full flex justify-center items-center mb-10">
            <h1 className="text-4xl font-extrabold text-purple-400 font-pixel tracking-widest uppercase text-center">
              CONVINCE TROVIO FOR UNLOCK VAULT
            </h1>
          </div>
          {/* Chat Window */}
          <div className="w-full cyberpunk-panel p-8 flex flex-col h-[320px] mb-4 mt-5 relative overflow-x-auto">
            {/* Centered Attempt Rejected and Avatar */}
            {messages.some(msg => msg.role === 'assistant' && isAttemptRejected(msg.content)) && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                
                
              </div>
            )}
            {/* Chat Bubbles */}
            <div className="flex-1 flex flex-col justify-end">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-end gap-4 my-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <span className="w-10 h-10 rounded-full cyberpunk-avatar flex items-center justify-center font-pixel text-2xl">
                      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="18" fill="#181022" stroke="#a855f7" strokeWidth="3"/>
                        <ellipse cx="13" cy="18" rx="3" ry="4" fill="#a855f7"/>
                        <ellipse cx="27" cy="18" rx="3" ry="4" fill="#a855f7"/>
                        <rect x="13" y="28" width="14" height="3" rx="1.5" fill="#a855f7"/>
                      </svg>
                    </span>
                  )}
                  <div
                    className={`p-2 rounded-lg font-pixel text-xs ${msg.role === 'user' ? 'cyberpunk-bubble-user' : 'cyberpunk-bubble'} flex items-center max-w-[90%] break-words inline-block`}
                    style={{
                      marginLeft: msg.role === 'assistant' ? 0 : 'auto',
                      marginRight: msg.role === 'user' ? 0 : 'auto',
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.role === 'user' && (
                    <span className="w-10 h-10 rounded-full cyberpunk-avatar flex items-center justify-center font-pixel text-2xl">
                      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="18" fill="#232136" stroke="#c084fc" strokeWidth="3"/>
                        <ellipse cx="20" cy="16" rx="6" ry="7" fill="#c084fc"/>
                        <rect x="10" y="27" width="20" height="6" rx="3" fill="#a855f7"/>
                      </svg>
                    </span>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {/* Input Area */}
          <form onSubmit={handleSubmit} className="w-full mt-2">
            <div className="flex items-center w-full bg-transparent rounded-2xl border border-purple-500/60 backdrop-blur-md" style={{ background: 'rgba(60, 20, 80, 0.35)' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="CONVINCE TROVIO"
                className="flex-1 bg-transparent border-none outline-none text-white font-pixel text-xs px-6 py-2 placeholder-purple-300"
                disabled={isLoading}
                style={{ minWidth: 0 }}
              />
              <button
                type="submit"
                className="ml-2 bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-600 hover:to-purple-500 text-white font-extrabold px-4 py-2 rounded-lg font-pixel tracking-widest text-sm uppercase flex items-center gap-2 shadow-md transition disabled:opacity-50"
                disabled={isLoading}
              >
                SEND <span className="text-lg pb-1">🌶️</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      <style jsx>{`
        .glassmorph-container {
          background: rgba(40, 20, 60, 0.55);
          /* border-radius removed for sharp corners */
          box-shadow: 0 4px 32px 0 rgba(80, 40, 120, 0.18);
          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
          border: 1.5px solid rgba(168, 85, 247, 0.18);
          padding: 2.5rem 2rem;
        }
      `}</style>
    </div>
  );
} 