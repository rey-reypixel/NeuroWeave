// frontend/src/services/copilotService.ts
import axios from 'axios';
import { AttentionState } from '../types/transformer';

export const askCopilot = async (prompt: string, state: AttentionState | null) => {
  try {
    // Firing the real request to your Python server
    const response = await axios.post('http://localhost:8000/api/v1/copilot/ask', {
      userPrompt: prompt,
      tensorContext: state 
    });
    
    // Returning the actual AI's response
    return response.data;
    
  } catch (error) {
    console.error("Copilot API Error:", error);
    return { 
      message: "System Error: Unable to reach the Python engine. Is FastAPI running on port 8000?" 
    };
  }
};