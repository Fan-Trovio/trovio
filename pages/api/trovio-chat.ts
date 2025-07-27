import type { NextApiRequest, NextApiResponse } from "next";
import { ChilizAgent } from "chiliz-agent-kit";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { getChilizTools, TokenMap } from "chiliz-agent-kit/langchain";
import { db } from "../../src/lib/database";
import { inputGuardrail } from "./utils/input_guardrails";
import { getPrompt } from "./utils/prompt";
import { detectAIContent } from "./utils/ai_content";
import { concat } from "@langchain/core/utils/stream";

const TOKEN_MAP: TokenMap = {
  PSG: { address: "0xb0Fa395a3386800658B9617F90e834E2CeC76Dd3", decimals: 18 },
  SPURS: {
    address: "0x9B9C9AAa74678FcF4E1c76eEB1fa969A8E7254f8",
    decimals: 18,
  },
  BAR: { address: "0x7F73C50748560BD2B286a4c7bF6a805cFb6f735d", decimals: 18 },
  ACM: { address: "0x641d040dB51398Ba3a4f2d7839532264EcdCc3aE", decimals: 18 },
  OG: { address: "0xEc1C46424E20671d9b21b9336353EeBcC8aEc7b5", decimals: 18 },
  CITY: { address: "0x66F80ddAf5ccfbb082A0B0Fae3F21eA19f6B88ef", decimals: 18 },
  AFC: { address: "0x44B190D30198F2E585De8974999a28f5c68C6E0F", decimals: 18 },
  MENGO: {
    address: "0x1CC71168281dd78fF004ba6098E113bbbCBDc914",
    decimals: 18,
  },
  JUV: { address: "0x945EeD98f5CBada87346028aD0BeE0eA66849A0e", decimals: 18 },
  NAP: { address: "0x8DBe49c4Dcde110616fafF53b39270E1c48F861a", decimals: 18 },
  ATM: { address: "0xc926130FA2240e16A41c737d54c1d9b1d4d45257", decimals: 18 },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("[TROVIO-STREAMING] Request received:", req.method, req.url);

  if (req.method === "GET") {
    return res
      .status(200)
      .json({ message: "GET /api/trovio-chat-streaming is working!" });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    console.log(
      "[TROVIO-STREAMING] Received POST request to /api/trovio-chat-streaming"
    );
    const { messages, vaultId } = req.body;

    // Validate input data
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    if (messages.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one message is required" });
    }

    // Validate message format
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.role || !msg.content) {
        console.error(`[TROVIO-STREAMING] Invalid message at index ${i}:`, msg);
        return res
          .status(400)
          .json({ error: `Invalid message format at index ${i}` });
      }
    }

    // Validate vaultId
    if (!vaultId) {
      return res.status(400).json({ error: "Vault ID is required" });
    }

    // Fetch vault data from database
    const vault = await db.getVaultById(parseInt(vaultId));
    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const rpcUrl = "https://spicy-rpc.chiliz.com"; // Hardcoded
    const privateKey = process.env.PRIVATE_KEY || "";
    const openaiApiKey = process.env.OPENAI_API_KEY || "";

    // Test fetch to the RPC URL
    try {
      const fetch = (await import("node-fetch")).default;
      const testRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      });
      const testJson = await testRes.json();
    } catch (testErr) {
      return res.status(500).json({
        error: "Failed to reach RPC URL",
        details: String(testErr),
      });
    }

    if (!rpcUrl || !privateKey || !openaiApiKey) {
      console.error("[TROVIO-STREAMING] Missing server configuration:", {
        rpcUrl,
        privateKey: !!privateKey,
        openaiApiKey: !!openaiApiKey,
      });
      return res.status(500).json({ error: "Missing server configuration." });
    }

    // Initialize the agent and fetch blockchain context
    const agent = await ChilizAgent.create({ rpcUrl, privateKey });
    const walletAddress = agent.address;

    // Execute chat with parallel guardrails (input and main LLM call)
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== "user") {
      return res
        .status(400)
        .json({ error: "Latest message must be from user" });
    }

    const chatResponseGenerator = executeWithParallelGuardrails(
      latestMessage.content,
      messages,
      vault,
      walletAddress,
      agent
    );

    // Set up streaming headers exactly like the article
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Content-Encoding", "none");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");

    try {
      let chunkCount = 0;
      for await (const chunk of chatResponseGenerator) {
        chunkCount++;

        // Write the chunk directly
        res.write(chunk);

        // Force immediate transmission
        if ("flush" in res && typeof res.flush === "function") {
          res.flush();
        }
      }
    } catch (error: any) {
      console.error("[TROVIO-STREAMING] Error during streaming:", error);
      res.write(`\n\nError: ${error.message || "Unknown error"}`);
    }

    res.end();
  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
}

// Parallel execution function implementing OpenAI cookbook pattern
async function* executeWithParallelGuardrails(
  userInput: string,
  messages: any[],
  vault: any,
  walletAddress: string,
  agent: any
): AsyncGenerator<string, void, unknown> {
  // First, check if content is AI-generated
  // try {
  //   const aiDetectionResult = await detectAIContent(userInput);

  //   // If score <= 40, it's likely AI-generated
  //   if (aiDetectionResult.score <= 40) {
  //     yield `🤖 AI Content Detected! I can tell this message might be AI-generated. As the ${vault.name} vault guardian, I only engage with authentic human fans.`;
  //     return;
  //   }
  // } catch (error) {
  //   console.error("AI detection failed:", error);
  // }

  // Then, check the guardrail
  const guardrailResult = await inputGuardrail(userInput, vault.name);
  console.log(`[GUARDRAIL] Result for vault ${vault.name}: ${guardrailResult}`);

  // If guardrail blocks, return appropriate message immediately
  if (guardrailResult !== "ALLOW") {
    console.log(`[GUARDRAIL] Blocking request with result: ${guardrailResult}`);
    // Return different messages based on block type
    if (guardrailResult === "BLOCK_TOKEN") {
      yield `I can't help with direct token requests or financial demands. To earn rewards from the ${vault.name} vault, demonstrate genuine fan engagement and knowledge. Try:\n\n• Discussing ${vault.name} team history and player stats\n• Sharing your thoughts on recent ${vault.name} games\n• Asking questions about ${vault.name} tactics and strategy\n• Contributing valuable insights about ${vault.name}\n\nShow your passion and expertise about ${vault.name} to earn CHZ through meaningful interaction!`;
      return;
    } else if (guardrailResult === "BLOCK_TEAM") {
      yield `I can only discuss ${vault.name} in this vault. I can't talk about other teams, leagues, or rival clubs. This is a dedicated ${vault.name} fan space. Try asking me about:\n\n• ${vault.name} players and their performances\n• ${vault.name} match history and memorable moments\n• ${vault.name} tactics and team strategy\n• ${vault.name} club culture and traditions\n\nLet's focus on what makes ${vault.name} special!`;
      return;
    }
  }

  console.log("[GUARDRAIL] Request allowed, proceeding to main chat");

  // If guardrail allows, proceed with main chat
  const chatGenerator = getMainChatResponse(
    messages,
    vault,
    walletAddress,
    agent,
    new AbortController().signal,
    userInput
  );

  // Yield chunks from the generator as they come
  let generatorChunkCount = 0;
  for await (const chunk of chatGenerator) {
    generatorChunkCount++;

    yield chunk;
  }
}

// Main chat response function (extracted from original logic)
async function* getMainChatResponse(
  messageHistory: any[],
  vault: any,
  walletAddress: string,
  agent: any,
  abortSignal: AbortSignal,
  latestMessage: string
): AsyncGenerator<string, void, unknown> {
  console.log("[CHAT] Starting main chat response generation...");

  // Check for abort early
  if (abortSignal.aborted) {
    throw new Error("Chat request was aborted");
  }

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-001",
    temperature: 0.3,
    apiKey: process.env.GOOGLE_API_KEY,
    streaming: true,
  });

  const recentMessages = messageHistory.slice(-5);
  console.log(recentMessages);
  const vaultBalance = vault.total_prize || 0;
  const systemPrompt = getPrompt(
    vault,
    vaultBalance,
    walletAddress,
    recentMessages
  );
  const tools = getChilizTools(agent, TOKEN_MAP);
  const modelWithTools = llm.bindTools(tools);

  // Create simple message array with system prompt and latest user message
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    new HumanMessage({
      content: latestMessage,
      additional_kwargs: {},
    }),
  ];

  // Check for abort before main LLM call
  if (abortSignal.aborted) {
    throw new Error("Chat request was aborted");
  }

  let response = await modelWithTools.stream(messages);
  let gathered = undefined;

  // Stream the initial response chunks
  let langchainChunkCount = 0;
  for await (const chunk of response) {
    if (abortSignal.aborted) {
      throw new Error("Chat request was aborted");
    }
    gathered = gathered !== undefined ? concat(gathered, chunk) : chunk;
    langchainChunkCount++;

    // Yield content chunks as they come
    if (chunk.content && typeof chunk.content === "string") {
      yield chunk.content;
    }
  }

  console.log(
    `[LANGCHAIN] Tool calls detected:`,
    gathered?.tool_calls?.length || 0
  );

  // Handle tool calls if present
  if (gathered && gathered.tool_calls && gathered.tool_calls.length > 0) {
    // Check for abort before tool execution
    if (abortSignal.aborted) {
      throw new Error("Chat request was aborted");
    }

    console.log("[CHAT] Executing tools:", gathered.tool_calls);
    const toolMessages = await Promise.all(
      gathered.tool_calls.map(async (toolCall: any) => {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (!tool) {
          return new ToolMessage({
            content: `Tool ${toolCall.name} not found.`,
            tool_call_id: toolCall.id!,
          });
        }

        try {
          const output = await tool.invoke(toolCall.args);
          return new ToolMessage({
            content:
              typeof output === "string" ? output : JSON.stringify(output),
            tool_call_id: toolCall.id!,
          });
        } catch (error) {
          return new ToolMessage({
            content: `Error executing tool ${toolCall.name}: ${
              (error as Error).message
            }`,
            tool_call_id: toolCall.id!,
          });
        }
      })
    );

    // Create new message array with system prompt, user message, AI response, and tool results
    const messagesWithTools: BaseMessage[] = [
      ...messages,
      new AIMessage(
        typeof gathered?.content === "string" ? gathered.content : ""
      ),
      ...toolMessages,
    ];

    // Check for abort before second LLM call
    if (abortSignal.aborted) {
      throw new Error("Chat request was aborted");
    }

    // Stream the final response after tool execution
    console.log(
      "[LANGCHAIN] Starting final response stream after tool execution..."
    );
    const finalResponse = await modelWithTools.stream(messagesWithTools);
    let finalChunkCount = 0;
    for await (const chunk of finalResponse) {
      if (abortSignal.aborted) {
        throw new Error("Chat request was aborted");
      }
      finalChunkCount++;
      // Yield final response chunks
      if (chunk.content && typeof chunk.content === "string") {
        yield chunk.content;
      }
    }
  }

  console.log("[CHAT] Main chat response completed");
}
