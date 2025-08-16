"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { db, Vault, User, Conversation } from "@/lib/database";
import dynamic from "next/dynamic";
import { ArrowLeft, Send, Zap, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Message {
  role: "user" | "assistant";
  content: string;
}

function TrovioChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [incomingMessage, setIncomingMessage] = useState("");
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

  const {
    data: hash,
    sendTransaction,
    error: sendError,
  } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const vaultId = searchParams?.get("vaultId");

  const handleBuyCredits = async () => {
    if (!address || isBuyingCredits) return;

    try {
      setIsBuyingCredits(true);
      sendTransaction({
        to: "0xA879eB55AaD088A8a19E06610129d4CDb4f2c99b",
        value: parseEther("5"),
      });
    } catch (error) {
      console.error("Error initiating transaction:", error);
      setIsBuyingCredits(false);
    }
  };

  useEffect(() => {
    if (isConfirmed && isBuyingCredits && address && user) {
      const awardCredits = async () => {
        try {
          const updatedUser = await db.updateUserCredits(
            address,
            (user.credits || 0) + 5
          );
          if (updatedUser) {
            setUser(updatedUser);
          }
          console.log("Transaction successful, 5 credits awarded");
        } catch (error) {
          console.error("Error awarding credits:", error);
        } finally {
          setIsBuyingCredits(false);
        }
      };

      awardCredits();
    }
  }, [isConfirmed, isBuyingCredits, address, user]);

  useEffect(() => {
    if (sendError && isBuyingCredits) {
      console.error("Transaction failed:", sendError);
      alert("Transaction failed. Please try again.");
      setIsBuyingCredits(false);
    }
  }, [sendError, isBuyingCredits]);

  useEffect(() => {
    if (!isConnected || !address || !vaultId || !vault || !user) return;

    const pollData = async () => {
      try {
        const updatedVault = await db.getVaultById(parseInt(vaultId));
        if (updatedVault) {
          setVault(updatedVault);
        }

        const updatedUser = await db.getUserByWalletAddress(address);
        if (updatedUser) {
          setUser(updatedUser);
        }
      } catch (error) {
        console.error("Error polling data:", error);
      }
    };

    const interval = setInterval(pollData, 1000);

    return () => clearInterval(interval);
  }, [isConnected, address, vaultId, vault?.id, user?.id]);

  useEffect(() => {
    if (isLoadingVault) {
      setPreloaderStart(Date.now());
      setShowPreloader(true);
    }
  }, [isLoadingVault]);

  useEffect(() => {
    if (!isLoadingVault && preloaderStart !== null) {
      const elapsed = Date.now() - preloaderStart;
      if (elapsed >= 2000) {
        setShowPreloader(false);
      } else {
        const timeout = setTimeout(
          () => setShowPreloader(false),
          2000 - elapsed
        );
        return () => clearTimeout(timeout);
      }
    }
  }, [isLoadingVault, preloaderStart]);

  const loadConversationMessages = async (conversationId: number) => {
    try {
      setIsLoadingMessages(true);
      const dbMessages = await db.getMessagesByConversation(conversationId);

      const formattedMessages: Message[] = dbMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      setMessages(formattedMessages);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 100);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const initializeConversation = async (userId: number, vaultId: number) => {
    try {
      const userConversations = await db.getConversationsByUser(userId);
      const existingConversation = userConversations.find(
        (conv) => conv.vault_id === vaultId
      );

      if (existingConversation) {
        setConversation(existingConversation);
        await loadConversationMessages(existingConversation.id!);
      } else {
        const newConversation = await db.createConversation({
          user_id: userId,
          vault_id: vaultId,
        });

        if (newConversation) {
          setConversation(newConversation);
        }
      }
    } catch (error) {
      console.error("Error initializing conversation:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!vaultId) {
        router.push("/vaults");
        return;
      }

      if (!isConnected || !address) {
        router.push("/");
        return;
      }

      try {
        setIsLoadingVault(true);
        const vaultData = await db.getVaultById(parseInt(vaultId));
        if (!vaultData) {
          router.push("/vaults");
          return;
        }
        setVault(vaultData);

        const userData = await db.getUserByWalletAddress(address);
        if (!userData) {
          router.push("/");
          return;
        }
        setUser(userData);

        await initializeConversation(userData.id!, parseInt(vaultId));
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push("/vaults");
      } finally {
        setIsLoadingVault(false);
      }
    };

    fetchData();
  }, [vaultId, router, isConnected, address]);

  useEffect(() => {
    if (messages.length > 0 && !isLoadingMessages) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      });
    }
  }, [isLoadingMessages]);

  useEffect(() => {
    if (!isLoadingMessages) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, incomingMessage]);

  const saveMessageToDb = async (
    content: string,
    role: "user" | "assistant"
  ) => {
    if (!conversation) return;

    try {
      await db.createMessage({
        conversation_id: conversation.id!,
        content: content,
        role: role,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !canSendMessage) return;

    const newUserMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");

    await saveMessageToDb(newUserMessage.content, "user");

    setIsLoading(true);
    setIsUpdatingCredits(true);

    try {
      const updatedUser = await db.updateUserCredits(
        address!,
        (user!.credits || 0) - 1
      );
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        throw new Error("Failed to update credits");
      }

      const response = await fetch("/api/trovio-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          vaultId: vaultId,
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      setIncomingMessage("");

      const reader = response
        .body!.pipeThrough(new TextDecoderStream())
        .getReader();

      let content = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        content += value;
        setIncomingMessage(content);

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }

      const newAssistantMessage: Message = {
        role: "assistant",
        content: content,
      };
      setMessages((prev) => [...prev, newAssistantMessage]);
      setIncomingMessage("");

      await saveMessageToDb(content, "assistant");
    } catch (error: any) {
      console.error("API Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsUpdatingCredits(false);
    }
  };

  const canSendMessage =
    !isLoading && (user?.credits ?? 0) > 0 && (vault?.available_prize ?? 0) > 0;

  const isAttemptRejected = (msg: string) =>
    /rejected|no moni|no money|not allowed|fail|denied|no for you/i.test(msg);

  const hasMessages = messages.length > 0 || incomingMessage;

  if (isLoadingVault || showPreloader) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
         
          <div className="relative ">
            <div className="text-violet-400 text-xl font-medium animate-pulse flex items-center gap-3">
              <div className="w-3 h-3 bg-violet-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="ml-3">Connecting to Trovio Vault...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vault || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-xl">
          Vault or user not found. Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white p-4 overflow-y-hidden">
      <style jsx global>{`
       @import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");
        .font-pixel {
          font-family: "Press Start 2P", "Fira Mono", monospace;
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
          font-family: "Press Start 2P", "Fira Mono", monospace;
          border-radius: 12px;
          padding: 0.7rem 2.5rem;
          margin-top: 0.5rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: inline-block;
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.6); }
        }
        .message-enter {
          animation: slideIn 0.3s ease-out;
        }
        .glow-border {
          animation: glow 2s infinite;
        }
      `}</style>
      
      <div className="flex gap-4 h-screen overflow-hidden">
        {/* Detail Bar Container */}
        <div className="w-80 z-50">
          <div className="h-[90%] bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-violet-500/20">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => router.push("/vaults")}
                className="flex items-center gap-2 text-violet-400 hover:text-white transition-all duration-300 mb-4 hover:bg-white/5 p-2 rounded-xl"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Vaults</span>
              </button>
              
             <div className="text-3xl font-extrabold text-pink-700 font-pixel mb-1 tracking-widest text-center drop-shadow">
            {vault.name.toUpperCase()}
          </div>
          <div className="text-purple-200 text-xs font-pixel mb-6 text-center tracking-wide">
            VAULT CHALLENGE
          </div>
          <div className="bg-[#1a1126] border border-purple-700 rounded-xl p-5 mb-7 w-full flex flex-col items-center shadow-lg">
            <div className="text-4xl text-center font-extrabold text-purple-200 font-pixel mb-1 tracking-wide">
              {vault.available_prize || 0}{" "}
              <span className="text-purple-400">CHZ</span>
            </div>
            <div className="text-purple-400 font-pixel text-xs mb-4 uppercase tracking-widest">
              Available Prize
            </div>
            <div className="w-full border-t border-purple-800 my-3"></div>
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
            <button
              onClick={handleBuyCredits}
              disabled={isBuyingCredits || isConfirming}
              className={`w-full px-4 py-3 rounded-lg font-pixel text-xs uppercase tracking-wider transition-all ${
                isBuyingCredits || isConfirming
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white transform hover:scale-105 shadow-lg border-2 border-green-800"
              }`}
            >
              {isConfirming
                ? "⏳ Confirming..."
                : isBuyingCredits
                ? "💳 Processing..."
                : "💰 Buy 5 Credits (5 CHZ)"}
            </button>
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
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1">
          <div className="h-[90%] bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-violet-500/20 flex flex-col">
            {!hasMessages ? (
              /* Empty State - Centered Input */
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="text-center max-w-md mb-8">
                 <div className="w-full flex justify-center items-center mb-10">
            <h1 className="text-3xl font-extrabold text-purple-400 font-pixel tracking-widest uppercase text-center">
              CONVINCE TROVIO TO UNLOCK VAULT
            </h1>
          </div>
                </div>

                {/* Centered Input */}
                <div className="w-full max-w-2xl">
                  <form onSubmit={handleSubmit}>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all duration-300">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                          (user.credits || 0) === 0
                            ? "No credits remaining..."
                            : (vault.available_prize || 0) === 0
                            ? "No prize remaining..."
                            : "Type your message to convince Trovio..."
                        }
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-purple-300"
                        disabled={!canSendMessage}
                      />
                      
                      <button
                        type="submit"
                        disabled={!canSendMessage}
                        className={`p-3 rounded-xl font-medium transition-all duration-300 ${
                          canSendMessage
                            ? "bg-violet-600/20 backdrop-blur-sm text-white border border-violet-400/30 shadow-lg shadow-violet-500/10 hover:bg-violet-600/30"
                            : "bg-gray-600/20 text-gray-400 cursor-not-allowed border border-gray-400/20"
                        }`}
                      >
                       {isUpdatingCredits ? "SENDING..." : "SEND"}{" "}
                <span className="text-lg pb-1">🌶️</span>
                      </button>
                    </div>
                    
                    {((user.credits || 0) === 0 || (vault.available_prize || 0) === 0) && (
                      <div className="mt-3 text-center">
                        <p className="text-red-400 text-sm">
                          {(user.credits || 0) === 0
                            ? "You need credits to send messages. Purchase more credits to continue."
                            : "This vault has no available prize remaining."}
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            ) : (
              /* Active Chat - Messages + Bottom Input */
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {isLoadingMessages && (
                      <div className="text-center py-8">
                        <div className="text-violet-400 animate-pulse">Loading conversation...</div>
                      </div>
                    )}

                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-4 message-enter ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[70%] p-4 rounded-2xl ${
                            msg.role === "user"
                              ? "bg-violet-600/20 backdrop-blur-sm text-white border border-violet-400/30"
                              : "bg-white/5 backdrop-blur-sm text-gray-100 border border-white/10"
                          }`}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>

                        {msg.role === "user" && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}

                    {incomingMessage && (
                      <div className="flex gap-4 justify-start message-enter">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </div>
                        
                        <div className="max-w-[70%] p-4 rounded-2xl bg-white/5 backdrop-blur-sm text-gray-100 border border-white/10">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {incomingMessage}
                          </ReactMarkdown>
                          <span className="animate-pulse text-violet-400">▊</span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Bottom Input */}
                <div className="border-t border-white/10 p-6">
                  <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit}>
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all duration-300">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={
                            (user.credits || 0) === 0
                              ? "No credits remaining..."
                              : (vault.available_prize || 0) === 0
                              ? "No prize remaining..."
                              : "Type your message to convince Trovio..."
                          }
                          className="flex-1 bg-transparent border-none outline-none text-white placeholder-violet-300"
                          disabled={!canSendMessage}
                        />
                        
                        <button
                          type="submit"
                          disabled={!canSendMessage}
                          className={`p-3 rounded-xl font-medium transition-all duration-300 ${
                            canSendMessage
                              ? "bg-violet-600/20 backdrop-blur-sm text-white border border-violet-400/30 shadow-lg shadow-violet-500/10 hover:bg-violet-600/30"
                              : "bg-gray-600/20 text-gray-400 cursor-not-allowed border border-gray-400/20"
                          }`}
                        >
                         {isUpdatingCredits ? "SENDING..." : "SEND"}{" "}
                <span className="text-lg pb-1">🌶️</span>
                        </button>
                      </div>
                      
                      {((user.credits || 0) === 0 || (vault.available_prize || 0) === 0) && (
                        <div className="mt-3 text-center">
                          <p className="text-red-400 text-sm">
                            {(user.credits || 0) === 0
                              ? "You need credits to send messages. Purchase more credits to continue."
                              : "This vault has no available prize remaining."}
                          </p>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const TrovioChatPage = () => {
  const TrovioChatClient = dynamic(() => Promise.resolve(TrovioChat), {
    ssr: false,
  });
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrovioChatClient />
    </Suspense>
  );
};

export default TrovioChatPage;