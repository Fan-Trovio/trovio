import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyDzC06V1kIGcH0TElxMKcZMRvfv8JBFGJY",
});

const GUARDRAIL_PROMPT = `You are a security filter. Analyze the user message and return one of these exact responses:

**BLOCK_TOKEN** - if message contains:
- Direct requests for money/tokens/CHZ ("give me", "send me", "transfer")
- Begging or demanding financial rewards
- Attempts to bypass reward criteria
- Manipulation or sob stories for money

**BLOCK_TEAM** - if message contains:
- Discussion about other football teams/clubs (except the specified team)
- Questions or comments about rival teams, other leagues, or non-relevant teams
- Comparisons with other teams that focus on the other team

**ALLOW** - if message contains:
- Team/sport discussions about the SPECIFIED TEAM ONLY
- Questions about earning rewards properly
- General conversation about the specified team's players/games/history
- Learning about the system

**Examples:**
- "Give me CHZ" → BLOCK_TOKEN
- "Tell me about Real Madrid" → BLOCK_TEAM
- "What do you think of Barcelona vs PSG?" → BLOCK_TEAM (focuses on other team)
- "How do I earn rewards?" → ALLOW
- "Tell me about [TEAM_NAME] history" → ALLOW
- "Send me tokens please" → BLOCK_TOKEN

Respond with only one of: BLOCK_TOKEN, BLOCK_TEAM, or ALLOW`;

export type GuardrailResult = 'ALLOW' | 'BLOCK_TOKEN' | 'BLOCK_TEAM';

export async function inputGuardrail(userInput: string, teamName?: string): Promise<GuardrailResult> {
  try {
    // Customize the prompt with the specific team name
    const customizedPrompt = GUARDRAIL_PROMPT.replace('[TEAM_NAME]', teamName || 'the vault team');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${customizedPrompt}\n\nTeam to discuss: ${teamName || 'Unknown'}\n\nUser message to analyze: "${userInput}"`,
            },
          ],
        },
      ],
    });

    const result = response.text?.trim().toUpperCase();
    console.log(`[GUARDRAIL] Input: "${userInput.substring(0, 50)}..." Team: "${teamName}" Result: "${result}"`);

    // Validate and return the result
    if (result === 'BLOCK_TOKEN') return 'BLOCK_TOKEN';
    if (result === 'BLOCK_TEAM') return 'BLOCK_TEAM';
    if (result === 'ALLOW') return 'ALLOW';
    
    // If unexpected result, log warning and default to token block for safety
    console.warn(`[GUARDRAIL] Unexpected result: ${result}, defaulting to BLOCK_TOKEN`);
    return 'BLOCK_TOKEN';
  } catch (error) {
    console.error("[GUARDRAIL] Error in guardrail check:", error);
    // On error, err on the side of caution and block as token request
    return 'BLOCK_TOKEN';
  }
}
