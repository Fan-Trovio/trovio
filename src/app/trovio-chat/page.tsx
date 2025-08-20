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
import {
  ArrowLeft,
  Send,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="relative">
          <div className="relative">
            <div className="text-violet-400 text-xl font-medium animate-pulse flex items-center gap-3">
              <div className="w-3 h-3 bg-violet-500 rounded-full animate-bounce"></div>
              <div
                className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <span className="ml-3">Connecting to Trovio Vault...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vault || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-red-400 text-xl">
          Vault or user not found. Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen relative bg-[#000000] text-white overflow-hidden">
     
     <div className="absolute top-20 right-0 flex items-center justify-center">
        {/* Outermost circle - very low opacity */}
        <div 
          className="bg-violet-500/5 w-[560px] h-[560px] absolute rounded-full animate-pulse blur-xl"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '0s',
            animationDuration: '4s'
          }}
        />
        <div 
          className="bg-violet-500/10 w-[540px] h-[540px] absolute rounded-full animate-pulse blur-xl"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '0s',
            animationDuration: '4s'
          }}
        />
        
        {/* Extra large circle */}
        <div 
          className="bg-violet-500/15 w-[500px] h-[500px] absolute rounded-full animate-pulse blur-lg"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '0.3s',
            animationDuration: '3.8s'
          }}
        />
        
        {/* Large circle */}
        <div 
          className="bg-violet-500/20 w-[460px] h-[460px] absolute rounded-full animate-pulse blur-lg"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '0.6s',
            animationDuration: '3.6s'
          }}
        />
        
        {/* Second largest circle */}
        <div 
          className="bg-violet-500/25 w-[420px] h-[420px] absolute rounded-full animate-pulse blur-lg"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '0.9s',
            animationDuration: '3.4s'
          }}
        />
        
        {/* Medium large circle */}
        <div 
          className="bg-violet-500/30 w-[380px] h-[380px] absolute rounded-full animate-pulse blur-md"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '1.2s',
            animationDuration: '3.2s'
          }}
        />
        
        {/* Medium circle */}
        <div 
          className="bg-violet-500/40 w-[340px] h-[340px] absolute rounded-full animate-pulse blur-md"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '1.5s',
            animationDuration: '3s'
          }}
        />
        
        {/* Medium small circle */}
        <div 
          className="bg-violet-500/50 w-[300px] h-[300px] absolute rounded-full animate-pulse blur-md"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '1.8s',
            animationDuration: '2.8s'
          }}
        />
        
        {/* Smaller circle */}
        <div 
          className="bg-violet-500/60 w-[260px] h-[260px] absolute rounded-full animate-pulse blur"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '2.1s',
            animationDuration: '2.6s'
          }}
        />
        
        {/* Small circle */}
        <div 
          className="bg-violet-500/70 w-[220px] h-[220px] absolute rounded-full animate-pulse blur"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '2.4s',
            animationDuration: '2.4s'
          }}
        />
        
        {/* Smaller circle */}
        <div 
          className="bg-violet-500/80 w-[180px] h-[180px] absolute rounded-full animate-pulse blur-sm"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '2.7s',
            animationDuration: '2.2s'
          }}
        />
        
        {/* Very small circle */}
        <div 
          className="bg-violet-500/85 w-[140px] h-[140px] absolute rounded-full animate-pulse blur-sm"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '3s',
            animationDuration: '2s'
          }}
        />
        
        {/* Tiny circle */}
        <div 
          className="bg-violet-500/90 w-[100px] h-[100px] absolute rounded-full animate-pulse blur-sm"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '3.3s',
            animationDuration: '1.8s'
          }}
        />
        
        {/* Smallest circle - highest opacity */}
        <div 
          className="bg-violet-500/95 w-[60px] h-[60px] absolute rounded-full animate-pulse blur-sm"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '3.6s',
            animationDuration: '1.5s'
          }}
        />
      </div>
       <div className="absolute bottom-10 left-1/3 flex items-center justify-center">
        {/* Outermost circle - very low opacity */}
        <div 
          className="bg-violet-500/5 w-[560px] h-[560px] absolute rounded-full animate-pulse blur-xl"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '0s',
            animationDuration: '4s'
          }}
        />
        <div 
          className="bg-violet-500/10 w-[540px] h-[540px] absolute rounded-full animate-pulse blur-xl"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '0s',
            animationDuration: '4s'
          }}
        />
        
        {/* Extra large circle */}
        <div 
          className="bg-violet-500/15 w-[500px] h-[500px] absolute rounded-full animate-pulse blur-lg"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '0.3s',
            animationDuration: '3.8s'
          }}
        />
        
        {/* Large circle */}
        <div 
          className="bg-violet-500/20 w-[460px] h-[460px] absolute rounded-full animate-pulse blur-lg"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '0.6s',
            animationDuration: '3.6s'
          }}
        />
        
        {/* Second largest circle */}
        <div 
          className="bg-violet-500/25 w-[420px] h-[420px] absolute rounded-full animate-pulse blur-lg"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '0.9s',
            animationDuration: '3.4s'
          }}
        />
        
        {/* Medium large circle */}
        <div 
          className="bg-violet-500/30 w-[380px] h-[380px] absolute rounded-full animate-pulse blur-md"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '1.2s',
            animationDuration: '3.2s'
          }}
        />
        
        {/* Medium circle */}
        <div 
          className="bg-violet-500/40 w-[340px] h-[340px] absolute rounded-full animate-pulse blur-md"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '1.5s',
            animationDuration: '3s'
          }}
        />
        
        {/* Medium small circle */}
        <div 
          className="bg-violet-500/50 w-[300px] h-[300px] absolute rounded-full animate-pulse blur-md"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '1.8s',
            animationDuration: '2.8s'
          }}
        />
        
        {/* Smaller circle */}
        <div 
          className="bg-violet-500/60 w-[260px] h-[260px] absolute rounded-full animate-pulse blur"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '2.1s',
            animationDuration: '2.6s'
          }}
        />
        
        {/* Small circle */}
        <div 
          className="bg-violet-500/70 w-[220px] h-[220px] absolute rounded-full animate-pulse blur"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '2.4s',
            animationDuration: '2.4s'
          }}
        />
        
        {/* Smaller circle */}
        <div 
          className="bg-violet-500/80 w-[180px] h-[180px] absolute rounded-full animate-pulse blur-sm"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '2.7s',
            animationDuration: '2.2s'
          }}
        />
        
        {/* Very small circle */}
        <div 
          className="bg-violet-500/85 w-[140px] h-[140px] absolute rounded-full animate-pulse blur-sm"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '3s',
            animationDuration: '2s'
          }}
        />
        
        {/* Tiny circle */}
        <div 
          className="bg-violet-500/90 w-[100px] h-[100px] absolute rounded-full animate-pulse blur-sm"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '3.3s',
            animationDuration: '1.8s'
          }}
        />
        
        {/* Smallest circle - highest opacity */}
        <div 
          className="bg-violet-500/95 w-[60px] h-[60px] absolute rounded-full animate-pulse blur-sm"
          style={{
            clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
            animationDelay: '3.6s',
            animationDuration: '1.5s'
          }}
        />
      </div>


      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");
        .font-pixel {
          font-family: "Press Start 2P", "Fira Mono", monospace;
        }
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
          }
        }
        .message-enter {
          animation: slideIn 0.3s ease-out;
        }
        .glow-border {
          animation: glow 2s infinite;
        }
      `}</style>

      <div className="flex z-50 h-screen items-center justify-center relative">
        {/* Sidebar */}
        <div className="w-80  h-[90%] bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-violet-500/20 mx-10 ">
          <div className="mb-6">
            <button
              onClick={() => router.push("/vaults")}
              className="flex items-center gap-2 text-violet-400 hover:text-white transition-all duration-300 mb-4  p-2 rounded-xl"
            >
              <ArrowLeft size={20} />
              <span className="font-normal text-sm font-pixel">Back to Vaults</span>
            </button>
          </div>

          {/* Vault Info */}
          <div className="mb-6">
            <div className="text-2xl font-extrabold text-pink-700 font-pixel mb-1 tracking-widest text-center drop-shadow">
              {vault.name.toUpperCase()}
            </div>
            <div className="text-purple-200 text-xs font-pixel mb-6 text-center tracking-wide">
              VAULT CHALLENGE
            </div>
          </div>

          {/* Prize and Credits Info */}
          <div className="bg-[#1a1126] border border-purple-700 rounded-xl p-5 mb-4 w-full flex flex-col items-center shadow-lg">
            <div className="text-4xl text-center font-extrabold text-purple-200 font-pixel mb-1 tracking-wide">
              {vault.available_prize || 0} <br />
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

        {/* Main Chat Area */}
        <div className="flex-1 h-screen flex flex-col items-center justify-center p-8 relative">
          {/* Chat Container - Dynamic Size */}
          <div
            className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-500 ease-in-out flex flex-col ${
              hasMessages
                ? "w-full max-w-4xl h-[90%] "
                : "w-full max-w-lg h-auto mt-20 py-8"
            }`}
          >
            {!hasMessages ? (
              /* Small Container - No Messages */

              <div className="p-6">
                <div className="text-center mb-6">
                  <h1 className="text-xl font-extrabold text-purple-400 font-pixel tracking-widest uppercase text-center">
                    CONVINCE TROVIO TO UNLOCK VAULT
                  </h1>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-[#3a3a3a] p-3 rounded-lg text-center">
                    <div className="text-violet-400 text-sm font-medium mb-1">
                      Saved Prompt
                    </div>
                    <div className="text-gray-400 text-xs">Templates</div>
                  </div>
                  <div className="bg-[#3a3a3a] p-3 rounded-lg text-center">
                    <div className="text-violet-400 text-sm font-medium mb-1">
                      Media Type
                    </div>
                    <div className="text-gray-400 text-xs">Selection</div>
                  </div>
                  <div className="bg-[#3a3a3a] p-3 rounded-lg text-center">
                    <div className="text-violet-400 text-sm font-medium mb-1">
                      Multilingual
                    </div>
                    <div className="text-gray-400 text-xs">Support</div>
                  </div>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="relative flex flex-col h-full"
                >
                  <div className="relative">
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
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                      disabled={!canSendMessage}
                    />
                    <button
                      type="submit"
                      disabled={!canSendMessage}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 w-min px-4 h-8 rounded-lg transition-all duration-300 flex items-center justify-center cursor-pointer ${
                        canSendMessage
                          ? "bg-violet-600 hover:bg-violet-700 text-white"
                          : "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isUpdatingCredits ? "SENDING..." : "SEND"}{" "}
                      <span className="text-lg pb-1">🌶️</span>
                    </button>
                  </div>
                </form>

                {((user.credits || 0) === 0 ||
                  (vault.available_prize || 0) === 0) && (
                  <div className="mt-3 text-center">
                    <p className="text-red-400 text-sm">
                      {(user.credits || 0) === 0
                        ? "You need credits to send messages"
                        : "This vault has no available prize remaining"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Large Container - With Messages */
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    {isLoadingMessages && (
                      <div className="text-center py-4">
                        <div className="text-violet-400 animate-pulse">
                          Loading conversation...
                        </div>
                      </div>
                    )}

                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 message-enter ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </div>
                        )}

                        <div
                          className={`max-w-[70%] p-3 rounded-2xl ${
                            msg.role === "user"
                              ? "bg-violet-600 text-white"
                              : "bg-[#3a3a3a] text-gray-100"
                          }`}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>

                        {msg.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}

                    {incomingMessage && (
                      <div className="flex gap-3 justify-start message-enter">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>

                        <div className="max-w-[70%] p-3 rounded-2xl bg-[#3a3a3a] text-gray-100">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {incomingMessage}
                          </ReactMarkdown>
                          <span className="animate-pulse text-violet-400">
                            ▊
                          </span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Bottom Input */}
                <div className="border-t border-gray-600 p-4">
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                          (user.credits || 0) === 0
                            ? "No credits remaining..."
                            : (vault.available_prize || 0) === 0
                            ? "No prize remaining..."
                            : "Type your message..."
                        }
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                        disabled={!canSendMessage}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e as any);
                          }
                        }}
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={!canSendMessage}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 h-8 rounded-lg transition-all duration-300 flex items-center justify-center ${
                          canSendMessage
                            ? "bg-violet-600 hover:bg-violet-700 text-white"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {isUpdatingCredits ? "SENDING..." : "SEND"}{" "}
                <span className="text-lg pl-1">🌶️</span>
                      </button>
                    </div>

                    {((user.credits || 0) === 0 ||
                      (vault.available_prize || 0) === 0) && (
                      <div className="mt-2 text-center">
                        <p className="text-red-400 text-sm">
                          {(user.credits || 0) === 0
                            ? "You need credits to send messages"
                            : "This vault has no available prize remaining"}
                        </p>
                      </div>
                    )}
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
