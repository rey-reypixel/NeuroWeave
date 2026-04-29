import { create } from 'zustand';
import axios from 'axios';
import { AttentionState } from '../types/transformer';

interface ModelStore {
  heads: AttentionState[] | null;
  activeHeadIndex: number;
  dimension: number;
  isLoading: boolean;
  calculateAttention: (text: string) => Promise<void>;
  setDimension: (dim: number) => void;
  setActiveHead: (index: number) => void;
  viewMode: 'student' | 'teacher';
  toggleView: () => void;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  heads: null,
  activeHeadIndex: 0,
  dimension: 4,
  isLoading: false,
  viewMode: 'student',
  toggleView: () => set((state) => ({ 
    viewMode: state.viewMode === 'student' ? 'teacher' : 'student'
  })),

  calculateAttention: async (text: string) => {
    set({ isLoading: true });
    try {
      const response = await axios.post('http://localhost:8000/api/v1/transformer/calculate', { 
        text, 
        dimension: get().dimension // TypeScript now knows dimension exists!
      });
      set({ heads: response.data, activeHeadIndex: 0, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },
  setDimension: (dim) => set({ dimension: dim }),
  setActiveHead: (index) => set({ activeHeadIndex: index })
}));