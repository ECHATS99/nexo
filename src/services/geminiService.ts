export interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

export const geminiService = {
  chat: async (prompt: string, history: Message[] = [], userContext: any = {}) => {
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, history, userContext }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to Nexo IA");
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Gemini service error:", error);
      throw error;
    }
  },
};
