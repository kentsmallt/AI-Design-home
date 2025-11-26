import { GoogleGenAI, Type } from "@google/genai";
import { UserIntent } from "../types";

// Helper to ensure API key exists
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Classifies the user's input text to determine if they want to edit the image
 * or just ask a question/shop.
 */
export const classifyUserIntent = async (userText: string): Promise<UserIntent> => {
  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Classify the following user input into one of two categories for an interior design app:
      1. "EDIT_IMAGE": The user wants to change the visual appearance, add/remove items, change style, colors, or layout of the current image. (e.g., "make it modern", "add a lamp", "change rug to blue").
      2. "CHAT_QUERY": The user is asking a question, asking for advice, shopping links, prices, or general conversation without explicitly asking to regenerate the image. (e.g., "where can I buy that?", "what style is this?", "give me tips").
      
      User Input: "${userText}"
      
      Respond ONLY with the category name.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              enum: [UserIntent.EDIT_IMAGE, UserIntent.CHAT_QUERY]
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return json.intent || UserIntent.CHAT_QUERY;
  } catch (error) {
    console.warn("Intent classification failed, defaulting to CHAT_QUERY", error);
    return UserIntent.CHAT_QUERY;
  }
};

/**
 * Edits the provided image based on the text prompt using Gemini 2.5 Flash Image.
 * Used for "Nano banana powered" feature.
 */
export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = getClient();
  const mimeType = 'image/jpeg'; // Standardize for simplicity, though could detect

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          {
            text: `Edit this interior design image. ${prompt}. Maintain high quality and photorealism.`
          }
        ]
      }
    });

    // Extract the image from the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

/**
 * Chat with the design consultant using Gemini 3 Pro Preview.
 * Supports grounding (Google Search) for shoppable links.
 * Used for "AI powered chatbot" feature.
 */
export const chatWithConsultant = async (
  currentBase64Image: string,
  history: { role: string; text: string }[],
  newMessage: string
) => {
  const ai = getClient();
  const mimeType = 'image/jpeg';

  try {
    // Construct the prompt history/context
    // We send the current image as context for the latest turn
    const parts: any[] = [
       {
        inlineData: {
          data: currentBase64Image,
          mimeType: mimeType
        }
      },
      { text: `You are an expert Interior Design Consultant. The user has uploaded an image of their room. 
      Your goal is to help them refine their design and find items to buy.
      
      If the user asks for products, use Google Search to find real shoppable links and specific product names.
      Be helpful, concise, and stylish.
      ` }
    ];

    // Add recent history context (simplified for single-turn logic with context, or we could use chat session)
    // Here we just append the user's latest message combined with history context if needed.
    // For simplicity in this stateless wrapper, we will just send the image + new prompt, 
    // but in a real app, passing full history to `contents` array is better.
    // Let's stick to single-turn with image context + query for robustness in this demo.
    
    parts.push({ text: `User query: ${newMessage}`});

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: parts
      },
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType cannot be JSON when using googleSearch
      }
    });

    const text = response.text || "I couldn't generate a response.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : null)
      .filter((item: any) => item !== null) || [];

    return { text, sources };

  } catch (error) {
    console.error("Error in chat:", error);
    throw error;
  }
};
