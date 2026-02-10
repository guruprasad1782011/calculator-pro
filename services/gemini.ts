
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

export class GeminiService {
  private ai: any;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async getMathExplanation(expression: string, result: string, userQuery?: string) {
    const prompt = userQuery 
      ? `User question about this math problem: "${userQuery}". The expression is "${expression}" and the result is "${result}". Please explain.`
      : `Explain the mathematical steps to solve: ${expression}. The result is ${result}. Provide a clear, step-by-step breakdown using Markdown.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are a world-class math professor. Explain concepts clearly, use LaTeX-style formatting for symbols (wrap in backticks), and be encouraging. If the user asks for a proof, provide a concise one.",
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });

      return response.text || "I couldn't generate an explanation at this time.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "There was an error communicating with the AI. Please try again later.";
    }
  }

  async startChat(history: ChatMessage[]) {
    return this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are MathNexus AI, a scientific assistant. You help users solve equations, explain theorems, and visualize math concepts. Be concise but thorough.",
      }
    });
  }
}

export const geminiService = new GeminiService();
