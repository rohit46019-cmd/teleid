
import { GoogleGenAI, Type } from "@google/genai";
import { TelegramGroup, GeminiInsight } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getGroupInsights(group: TelegramGroup): Promise<GeminiInsight> {
  const prompt = `Analyze this Telegram group and provide administrative insights:
    Name: ${group.name}
    Description: ${group.description}
    Members: ${group.memberCount}
    Category: ${group.category}
    
    Provide a professional summary, a strategy for growth, and a creative suggestion for member retention.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            suggestion: { type: Type.STRING },
          },
          required: ["title", "summary", "suggestion"],
        },
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: "Group Analysis",
      summary: "Could not generate insights at this time.",
      suggestion: "Try again later."
    };
  }
}

export async function generateLinkDescription(groupName: string): Promise<string> {
  const prompt = `Generate a short, enticing 1-sentence invite message for a group named "${groupName}" that emphasizes exclusivity.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    return `You're invited to join ${groupName}! This link is for your eyes only.`;
  }
}
