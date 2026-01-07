
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AIModelMode, Coordinates } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const fetchAIResponse = async (
  prompt: string,
  mode: AIModelMode,
  coords?: Coordinates,
  systemInstruction?: string
): Promise<{ text: string; links?: { title: string; uri: string }[] }> => {
  const ai = getAIClient();
  
  if (mode === AIModelMode.DEEP) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are Nova, an ultra-intelligent browser assistant. Provide deep, structured reasoning for complex queries.",
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    return { text: response.text || '' };
  } else if (mode === AIModelMode.SEARCH) {
    // Search + Maps Grounding Mode (Requires Gemini 2.5 for combined tools)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an AI browser with live internet access via Google Search and Google Maps. Provide up-to-the-minute information and location-based results.",
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        toolConfig: coords ? {
          retrievalConfig: {
            latLng: {
              latitude: coords.latitude,
              longitude: coords.longitude
            }
          }
        } : undefined
      },
    });
    
    const links: { title: string; uri: string }[] = [];
    
    // Extract Grounding Chunks
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web) {
        links.push({ title: chunk.web.title || 'Web Result', uri: chunk.web.uri });
      }
      if (chunk.maps) {
        links.push({ title: chunk.maps.title || 'Location Result', uri: chunk.maps.uri });
      }
    });

    return { text: response.text || '', links };
  } else {
    // Fast Lite Mode
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: prompt,
      config: {
        systemInstruction: "You are a lightning-fast browser engine. Be concise, accurate, and direct."
      },
    });
    return { text: response.text || '' };
  }
};
