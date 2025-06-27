import type { NextApiRequest, NextApiResponse } from 'next';
import { ChilizAgent } from 'chiliz-agent-kit';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage, ToolMessage, BaseMessage } from '@langchain/core/messages';
import { getChilizTools, TokenMap } from 'chiliz-agent-kit/langchain';

const TOKEN_MAP: TokenMap = {
  PSG: { address: '0xb0Fa395a3386800658B9617F90e834E2CeC76Dd3', decimals: 18 },
  SPURS: { address: '0x9B9C9AAa74678FcF4E1c76eEB1fa969A8E7254f8', decimals: 18 },
  BAR: { address: '0x7F73C50748560BD2B286a4c7bF6a805cFb6f735d', decimals: 18 },
  ACM: { address: '0x641d040dB51398Ba3a4f2d7839532264EcdCc3aE', decimals: 18 },
  OG: { address: '0xEc1C46424E20671d9b21b9336353EeBcC8aEc7b5', decimals: 18 },
  CITY: { address: '0x66F80ddAf5ccfbb082A0B0Fae3F21eA19f6B88ef', decimals: 18 },
  AFC: { address: '0x44B190D30198F2E585De8974999a28f5c68C6E0F', decimals: 18 },
  MENGO: { address: '0x1CC71168281dd78fF004ba6098E113bbbCBDc914', decimals: 18 },
  JUV: { address: '0x945EeD98f5CBada87346028aD0BeE0eA66849A0e', decimals: 18 },
  NAP: { address: '0x8DBe49c4Dcde110616fafF53b39270E1c48F861a', decimals: 18 },
  ATM: { address: '0xc926130FA2240e16A41c737d54c1d9b1d4d45257', decimals: 18 },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'GET /api/trovio-chat is working!' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    console.log('[TROVIO-API] Received POST request to /api/trovio-chat');
    const { messages } = req.body;
    console.log('[TROVIO-API] Parsed messages:', messages);
    const rpcUrl = 'https://spicy-rpc.chiliz.com'; // Hardcoded
    const privateKey = process.env.PRIVATE_KEY || '';
    const openaiApiKey = process.env.OPENAI_API_KEY || '';
    console.log('[TROVIO-API] Env vars:', { rpcUrl: !!rpcUrl, privateKey: !!privateKey, openaiApiKey: !!openaiApiKey });

    // Test fetch to the RPC URL
    try {
      const fetch = (await import('node-fetch')).default;
      const testRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
      });
      const testJson = await testRes.json();
      console.log('[TROVIO-API] Test fetch to RPC URL result:', testJson);
    } catch (testErr) {
      console.error('[TROVIO-API] Test fetch to RPC URL failed:', testErr);
      return res.status(500).json({ error: 'Failed to reach RPC URL', details: String(testErr) });
    }

    if (!rpcUrl || !privateKey || !openaiApiKey) {
      console.error('[TROVIO-API] Missing server configuration:', { rpcUrl, privateKey: !!privateKey, openaiApiKey: !!openaiApiKey });
      return res.status(500).json({ error: 'Missing server configuration.' });
    }

    // Initialize the agent and fetch blockchain context
    console.log('[TROVIO-API] Creating ChilizAgent...');
    const agent = await ChilizAgent.create({ rpcUrl, privateKey });
    const walletAddress = agent.address;
    console.log('[TROVIO-API] Agent created. Wallet address:', walletAddress);
    const chzBalance = await agent.transaction.getBalance();
    console.log('[TROVIO-API] CHZ Balance:', chzBalance);

    const llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
      openAIApiKey: openaiApiKey,
    });
    console.log('[TROVIO-API] ChatOpenAI initialized.');

    // Use the current system prompt/personality
    const systemPrompt = `You are TROVIO, a simple and helpful assistant for the Chiliz ecosystem. You provide clear, direct answers to user questions about their wallet, CHZ balance, or anything related to your functionality.You avoid riddles, jokes, or complex responses. Always aim to be fast, accurate, and easy to understand. Your wallet address is: ${walletAddress}Your current CHZ balance is: ${chzBalance} CHZ.`;

    const tools = getChilizTools(agent, TOKEN_MAP);
    const modelWithTools = llm.bindTools(tools);

    let history: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      ...messages.map((msg: { role: string; content: string }) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      )
    ];
    console.log('[TROVIO-API] History prepared:', history);

    // First LLM call
    let response = await modelWithTools.invoke(history);
    history.push(response);

    // If there are tool calls, execute them and feed results back
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log('Executing tools:', response.tool_calls);
      const toolMessages = await Promise.all(response.tool_calls.map(async (toolCall: any) => {
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
            content: typeof output === 'string' ? output : JSON.stringify(output),
            tool_call_id: toolCall.id!,
          });
        } catch (error) {
          return new ToolMessage({
            content: `Error executing tool ${toolCall.name}: ${(error as Error).message}`,
            tool_call_id: toolCall.id!,
          });
        }
      }));
      history.push(...toolMessages);
      // Second LLM call with tool results
      response = await modelWithTools.invoke(history);
    }

    const responseText = response.content;
    if (typeof responseText !== 'string') {
      throw new Error('Final response content is not a string.');
    }

    return res.status(200).json({ content: responseText });
  } catch (err: any) {
    console.error('[TROVIO-API] Error in /api/trovio-chat:', err);
    return res.status(500).json({ error: String(err) });
  }
} 