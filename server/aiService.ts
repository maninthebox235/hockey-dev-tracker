import { invokeLLM } from "./_core/llm";

export interface VideoAnalysisInput {
  videoTitle: string;
  videoDescription?: string;
  videoType: "practice" | "game" | "drill";
  playerName?: string;
  playerPosition?: string;
}

export interface FeedbackResult {
  whatWentWell: string;
  areasForImprovement: string;
  recommendedDrills: string;
}

/**
 * Generate team-wide feedback for a hockey video
 */
export async function generateTeamFeedback(input: VideoAnalysisInput): Promise<FeedbackResult> {
  const systemPrompt = `You are an expert hockey coach with decades of experience analyzing team performance. 
You provide constructive, actionable feedback that helps teams improve their game.
Your feedback should be specific, encouraging, and focused on practical improvements.`;

  const userPrompt = `Analyze this hockey ${input.videoType} video and provide team-wide feedback:

Title: ${input.videoTitle}
${input.videoDescription ? `Description: ${input.videoDescription}` : ""}

Please provide:
1. What went well (team strengths observed)
2. Areas for improvement (specific tactical or technical issues)
3. Recommended drills (3-5 specific drills to address the areas for improvement)

Format your response as JSON with these exact keys: whatWentWell, areasForImprovement, recommendedDrills`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "team_feedback",
          strict: true,
          schema: {
            type: "object",
            properties: {
              whatWentWell: {
                type: "string",
                description: "Positive observations about team performance",
              },
              areasForImprovement: {
                type: "string",
                description: "Specific areas where the team can improve",
              },
              recommendedDrills: {
                type: "string",
                description: "List of 3-5 specific drills to practice",
              },
            },
            required: ["whatWentWell", "areasForImprovement", "recommendedDrills"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const feedback = JSON.parse(contentStr) as FeedbackResult;
    return feedback;
  } catch (error) {
    console.error("Error generating team feedback:", error);
    throw new Error("Failed to generate team feedback");
  }
}

/**
 * Generate individual player feedback for a hockey video
 */
export async function generateIndividualFeedback(
  input: VideoAnalysisInput
): Promise<FeedbackResult> {
  if (!input.playerName) {
    throw new Error("Player name is required for individual feedback");
  }

  const systemPrompt = `You are an expert hockey coach specializing in player development. 
You provide personalized, constructive feedback that helps individual players improve their skills.
Your feedback should be specific to the player's position and focused on actionable improvements.`;

  const userPrompt = `Analyze this hockey ${input.videoType} video and provide individual feedback for player ${input.playerName}${input.playerPosition ? ` (${input.playerPosition})` : ""}:

Title: ${input.videoTitle}
${input.videoDescription ? `Description: ${input.videoDescription}` : ""}

Please provide:
1. What went well (individual strengths and good plays)
2. Areas for improvement (specific skills or decisions to work on)
3. Recommended drills (3-5 position-specific drills for this player)

Format your response as JSON with these exact keys: whatWentWell, areasForImprovement, recommendedDrills`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "individual_feedback",
          strict: true,
          schema: {
            type: "object",
            properties: {
              whatWentWell: {
                type: "string",
                description: "Positive observations about player performance",
              },
              areasForImprovement: {
                type: "string",
                description: "Specific areas where the player can improve",
              },
              recommendedDrills: {
                type: "string",
                description: "List of 3-5 position-specific drills",
              },
            },
            required: ["whatWentWell", "areasForImprovement", "recommendedDrills"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const feedback = JSON.parse(contentStr) as FeedbackResult;
    return feedback;
  } catch (error) {
    console.error("Error generating individual feedback:", error);
    throw new Error("Failed to generate individual feedback");
  }
}

/**
 * Generate feedback for multiple players in a single video
 */
export async function generateBulkIndividualFeedback(
  videoInput: VideoAnalysisInput,
  players: Array<{ id: string; name: string; position?: string }>
): Promise<Array<{ playerId: string; feedback: FeedbackResult }>> {
  const results = [];

  for (const player of players) {
    try {
      const feedback = await generateIndividualFeedback({
        ...videoInput,
        playerName: player.name,
        playerPosition: player.position,
      });
      results.push({ playerId: player.id, feedback });
    } catch (error) {
      console.error(`Failed to generate feedback for player ${player.name}:`, error);
      // Continue with other players even if one fails
    }
  }

  return results;
}

