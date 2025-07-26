interface AIContentDetectionResponse {
  status: number;
  score: number;
  sentences: {
    text: string;
    score: number;
  };
  input: string;
  attack_detected: {
    zero_width_space: boolean;
    homoglyph_attack: boolean;
  };
  readability_score: number;
  credits_used: number;
  credits_remaining: number;
  version: string;
  language: string;
}

interface AIContentDetectionOptions {
  text: string;
}

export async function detectAIContent(
  userInput: string,
  options: Partial<AIContentDetectionOptions> = {}
): Promise<AIContentDetectionResponse> {
  const apiToken = process.env.WINSTON_AI_API_KEY;

  if (!apiToken) {
    throw new Error("WINSTON_AI_API_KEY environment variable is required");
  }

  const requestOptions = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: userInput,
    }),
  };

  try {
    const response = await fetch(
      "https://api.gowinston.ai/v2/ai-content-detection",
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: AIContentDetectionResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error detecting AI content:", error);
    throw error;
  }
}
