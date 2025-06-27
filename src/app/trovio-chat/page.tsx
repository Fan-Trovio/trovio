"use client";

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, Vault, User, Conversation } from '@/lib/database';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function TrovioChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vault, setVault] = useState<Vault | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoadingVault, setIsLoadingVault] = useState(true);
  const [isUpdatingCredits, setIsUpdatingCredits] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderStart, setPreloaderStart] = useState<number | null>(null);
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  // Transaction hooks
  const { data: hash, sendTransaction, error: sendError } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  
  const vaultId = searchParams?.get('vaultId');

  // Handle buy credits transaction
  const handleBuyCredits = async () => {
    if (!address || isBuyingCredits) return;
    
    try {
      setIsBuyingCredits(true);
      
      // Send 5 CHZ to the specified address
      sendTransaction({
        to: '0xA879eB55AaD088A8a19E06610129d4CDb4f2c99b',
        value: parseEther('5'),
      });
      
    } catch (error) {
      console.error('Error initiating transaction:', error);
      setIsBuyingCredits(false);
    }
  };

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && isBuyingCredits && address && user) {
      const awardCredits = async () => {
        try {
          // Award 5 credits to the user
          const updatedUser = await db.updateUserCredits(address, (user.credits || 0) + 5);
          if (updatedUser) {
            setUser(updatedUser);
          }
          console.log('Transaction successful, 5 credits awarded');
        } catch (error) {
          console.error('Error awarding credits:', error);
        } finally {
          setIsBuyingCredits(false);
        }
      };
      
      awardCredits();
    }
  }, [isConfirmed, isBuyingCredits, address, user]);

  // Handle transaction error
  useEffect(() => {
    if (sendError && isBuyingCredits) {
      console.error('Transaction failed:', sendError);
      alert('Transaction failed. Please try again.');
      setIsBuyingCredits(false);
    }
  }, [sendError, isBuyingCredits]);

  // Real-time polling for vault amount and user credits
  useEffect(() => {
    if (!isConnected || !address || !vaultId || !vault || !user) return;

    const pollData = async () => {
      try {
        // Fetch updated vault data
        const updatedVault = await db.getVaultById(parseInt(vaultId));
        if (updatedVault) {
          setVault(updatedVault);
        }

        // Fetch updated user data
        const updatedUser = await db.getUserByWalletAddress(address);
        if (updatedUser) {
          setUser(updatedUser);
        }
      } catch (error) {
        console.error('Error polling data:', error);
      }
    };

    // Poll every second
    const interval = setInterval(pollData, 1000);

    return () => clearInterval(interval);
  }, [isConnected, address, vaultId, vault?.id, user?.id]);

  // Preloader effect: set start time when loading begins
  useEffect(() => {
    if (isLoadingVault) {
      setPreloaderStart(Date.now());
      setShowPreloader(true);
    }
  }, [isLoadingVault]);

  // Hide preloader only after both loading is done and 2 seconds have passed
  useEffect(() => {
    if (!isLoadingVault && preloaderStart !== null) {
      const elapsed = Date.now() - preloaderStart;
      if (elapsed >= 2000) {
        setShowPreloader(false);
      } else {
        const timeout = setTimeout(() => setShowPreloader(false), 2000 - elapsed);
        return () => clearTimeout(timeout);
      }
    }
  }, [isLoadingVault, preloaderStart]);

  // Load conversation messages from database
  const loadConversationMessages = async (conversationId: number) => {
    try {
      setIsLoadingMessages(true);
      const dbMessages = await db.getMessagesByConversation(conversationId);
      
      const formattedMessages: Message[] = dbMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Create or find existing conversation
  const initializeConversation = async (userId: number, vaultId: number) => {
    try {
      // Check if conversation already exists
      const userConversations = await db.getConversationsByUser(userId);
      const existingConversation = userConversations.find(conv => conv.vault_id === vaultId);
      
      if (existingConversation) {
        setConversation(existingConversation);
        await loadConversationMessages(existingConversation.id!);
      } else {
        // Create new conversation
        const newConversation = await db.createConversation({
          user_id: userId,
          vault_id: vaultId
        });
        
        if (newConversation) {
          setConversation(newConversation);
        }
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  // Fetch vault and user data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!vaultId) {
        router.push('/vaults');
        return;
      }
      
      if (!isConnected || !address) {
        router.push('/');
        return;
      }
      
      try {
        setIsLoadingVault(true);
        
        // Fetch vault data
        const vaultData = await db.getVaultById(parseInt(vaultId));
        if (!vaultData) {
          router.push('/vaults');
          return;
        }
        setVault(vaultData);
        
        // Fetch user data
        const userData = await db.getUserByWalletAddress(address);
        if (!userData) {
          router.push('/');
          return;
        }
        setUser(userData);
        
        // Initialize conversation
        await initializeConversation(userData.id!, parseInt(vaultId));
        
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/vaults');
      } finally {
        setIsLoadingVault(false);
      }
    };

    fetchData();
  }, [vaultId, router, isConnected, address]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save message to database
  const saveMessageToDb = async (content: string, role: 'user' | 'assistant') => {
    if (!conversation) return;
    
    try {
      await db.createMessage({
        conversation_id: conversation.id!,
        content: content,
        role: role
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !vaultId || !user || !address) return;
    
    // Check if user has credits and vault has amount
    if ((user.credits || 0) === 0) {
      alert('You have no credits remaining. Please get more credits to continue chatting.');
      return;
    }
    
    if ((vault?.available_prize || 0) === 0) {
      alert('This vault has no available prize remaining.');
      return;
    }
    
    const userMessage = input.trim();
    setInput('');
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Save user message to database
    await saveMessageToDb(userMessage, 'user');
    
    setIsLoading(true);
    setIsUpdatingCredits(true);
    
    try {
      // Deduct 1 credit from user's account
      const updatedUser = await db.updateUserCredits(address, (user.credits || 0) - 1);
      if (updatedUser) {
        setUser(updatedUser);
      }
      
      // Send message to API
      const res = await fetch('/api/trovio-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: userMessage }],
          vaultId: vaultId
        })
      });
      
      const data = await res.json();
      let assistantResponse = '';
      
      if (data.content) {
        assistantResponse = data.content;
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        assistantResponse = "I was unable to produce a text response.";
        setMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);
      }
      
      // Save assistant response to database
      await saveMessageToDb(assistantResponse, 'assistant');
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = `Sorry, I encountered an error: ${(error as Error).message}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      
      // Save error message to database
      await saveMessageToDb(errorMessage, 'assistant');
      
      // Refund the credit on error
      if (user && address) {
        try {
          const refundedUser = await db.updateUserCredits(address, (user.credits || 0));
          if (refundedUser) {
            setUser(refundedUser);
          }
        } catch (refundError) {
          console.error('Error refunding credit:', refundError);
        }
      }
    } finally {
      setIsLoading(false);
      setIsUpdatingCredits(false);
    }
  };

  // Helper: show ATTEMPT REJECTED if assistant message contains 'rejected' or similar
  const isAttemptRejected = (msg: string) =>
    /rejected|no moni|no money|not allowed|fail|denied|no for you/i.test(msg);

  // Loading state with GIF preloader
  if (showPreloader) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXluaWZlczA0MHYwbnhlZDU1cmUwc3VkZHM2b3prNmY5aG93Z2xrcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/DEtWVHQ1WNUbSZkfQU/giphy.gif" alt="Loading..." className="w-600 h-600" />
      </div>
    );
  }

  // Vault or user not found
  if (!vault || !user) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="text-red-400 font-pixel">Vault or user not found</div>
      </div>
    );
  }

  const canSendMessage = (user.credits || 0) > 0 && (vault.available_prize || 0) > 0 && !isLoading && !isUpdatingCredits;

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
        <div className="w-80 flex flex-col items-center py-10 px-6 cyberpunk-panel relative h-full min-h-[500px]">
          <div 
            className="text-purple-400 text-base font-pixel mb-4 cursor-pointer hover:text-purple-300 transition self-start"
            onClick={() => router.push('/vaults')}
          >
            ← Back to Vaults
          </div>
          <div className="text-3xl font-extrabold text-pink-700 font-pixel mb-1 tracking-widest text-center drop-shadow">
            {vault.name.toUpperCase()}
          </div>
          <div className="text-purple-200 text-xs font-pixel mb-6 text-center tracking-wide">
            VAULT CHALLENGE
          </div>
          <div className="bg-[#1a1126] border border-purple-700 rounded-xl p-5 mb-7 w-full flex flex-col items-center shadow-lg">
            <div className="text-4xl font-extrabold text-purple-200 font-pixel mb-1 tracking-wide">
              {vault.available_prize || 0} <span className="text-purple-400">CHZ</span>
            </div>
            <div className="text-purple-400 font-pixel text-xs mb-4 uppercase tracking-widest">
              Available Prize
            </div>
            <div className="w-full border-t border-purple-800 my-3"></div>
            {/* Credits Display */}
            <div className="w-full mb-3 p-3 bg-[#2a1840] rounded-lg border border-purple-800 flex flex-col items-center">
              <div className="text-2xl font-extrabold text-yellow-400 font-pixel mb-1">
                {user.credits || 0}
              </div>
              <div className="text-xs text-purple-200 text-center font-pixel lowercase tracking-wider">
                Credits Remaining
              </div>
              <div className="text-xs text-gray-400 font-pixel mt-1">
                1 credit/message
              </div>
            </div>
            <div className="w-full border-t border-purple-800 my-3"></div>
            {/* Buy Credits */}
            <button
              onClick={handleBuyCredits}
              disabled={isBuyingCredits || isConfirming}
              className={`w-full px-4 py-3 rounded-lg font-pixel text-xs uppercase tracking-wider transition-all ${
                isBuyingCredits || isConfirming
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white transform hover:scale-105 shadow-lg border-2 border-green-800'
              }`}
            >
              {isConfirming ? '⏳ Confirming...' : isBuyingCredits ? '💳 Processing...' : '💰 Buy 5 Credits (5 CHZ)'}
            </button>
            {/* Warnings */}
            {(user.credits || 0) <= 5 && (user.credits || 0) > 0 && (
              <div className="w-full mt-3 p-2 bg-yellow-900/40 rounded border border-yellow-600">
                <div className="text-xs text-yellow-400 font-pixel text-center">
                  ⚠️ Low Credits!
                </div>
              </div>
            )}
            {(user.credits || 0) === 0 && (
              <div className="w-full mt-3 p-2 bg-red-900/40 rounded border border-red-600">
                <div className="text-xs text-red-400 font-pixel text-center">
                  ❌ No Credits Left!
                </div>
              </div>
            )}
            {(vault.available_prize || 0) === 0 && (
              <div className="w-full mt-3 p-2 bg-red-900/40 rounded border border-red-600">
                <div className="text-xs text-red-400 font-pixel text-center">
                  ❌ No Prize Remaining!
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col items-center justify-center mt-18">
          {/* Top Title */}
          <div className="w-full flex justify-center items-center mb-10">
            <h1 className="text-3xl font-extrabold text-purple-400 font-pixel tracking-widest uppercase text-center">
              CONVINCE TROVIO TO UNLOCK VAULT
            </h1>
          </div>
          {/* Chat Window */}
          <div className="w-full cyberpunk-panel p-8 flex flex-col h-[320px] mb-4 mt-5 relative overflow-x-auto">
            {/* Loading Messages */}
            {isLoadingMessages && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                <div className="text-purple-400 font-pixel animate-pulse">Loading conversation...</div>
              </div>
            )}
            
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
                    className={`p-2 rounded-lg font-pixel text-xs ${msg.role === 'user' ? 'cyberpunk-bubble-user' : 'cyberpunk-bubble'}  items-center max-w-[90%] break-words inline-block`}
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
                placeholder={
                  (user.credits || 0) === 0 ? "NO CREDITS REMAINING" :
                  (vault.available_prize || 0) === 0 ? "NO PRIZE REMAINING" :
                  "CONVINCE TROVIO"
                }
                className="flex-1 bg-transparent border-none outline-none text-white font-pixel text-xs px-6 py-2 placeholder-purple-300"
                disabled={!canSendMessage}
                style={{ minWidth: 0 }}
              />
              <button
                type="submit"
                disabled={!canSendMessage}
                className={`ml-2 font-extrabold px-4 py-2 rounded-lg font-pixel tracking-widest text-sm uppercase flex items-center gap-2 shadow-md transition ${
                  canSendMessage 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-600 hover:to-purple-500 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                {isUpdatingCredits ? 'SENDING...' : 'SEND'} <span className="text-lg pb-1">🌶️</span>
              </button>
            </div>
            {((user.credits || 0) === 0 || (vault.available_prize || 0) === 0) && (
              <div className="text-center mt-2">
                <div className="text-xs text-red-400 font-pixel">
                  {(user.credits || 0) === 0 
                    ? "You need credits to send messages. Get more credits to continue."
                    : "This vault has no available prize remaining."
                  }
                </div>
              </div>
            )}
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
          border-radius: 5px;
          padding: 2.5rem 2rem;
        }
      `}</style>
    </div>
  );
} 