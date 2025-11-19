import { GoogleGenAI, Type } from "@google/genai";
import { CreatureCard, ElementType } from "../types";
import { FALLBACK_DECK } from "../constants";

export const generateDeck = async (theme: string): Promise<Omit<CreatureCard, 'id'>[]> => {
  try {
    if (!process.env.API_KEY) {
      console.warn("No API KEY found, using fallback deck.");
      return FALLBACK_DECK;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 12 balanced creature cards for a board game with the theme: "${theme}".
      The elements must be roughly distributed among FIRE, WATER, EARTH, WIND.
      Costs should range from 20 to 120.
      ST (Strength) and HP (Health) should generally correlate with Cost but allow for glass cannons or tanks.
      Descriptions should be flavor text under 10 words.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              element: { type: Type.STRING, enum: ["FIRE", "WATER", "EARTH", "WIND", "NEUTRAL"] },
              cost: { type: Type.INTEGER },
              st: { type: Type.INTEGER },
              hp: { type: Type.INTEGER },
              description: { type: Type.STRING },
            },
            required: ["name", "element", "cost", "st", "hp", "description"]
          }
        }
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    
    // Map and validate
    return rawData.map((card: any) => ({
      ...card,
      mhp: card.hp, // Set Max HP
    }));

  } catch (error) {
    console.error("Gemini Generation Failed:", error);
    return FALLBACK_DECK;
  }
};