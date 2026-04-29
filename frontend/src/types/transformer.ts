// frontend/src/types/transformer.ts

export type Matrix = number[][];

export interface Token {
  id: string;
  text: string;
  position: number;
}

export interface AttentionState {
  layerIndex: number;
  headIndex: number;
  tokens: Token[];
  
  // NEW: Added to match the upgraded Python backend
  embeddings: Matrix; 
  positionalEncoding: Matrix;

  queries: Matrix;
  keys: Matrix;
  values: Matrix;
  rawScores: Matrix;
  maskedScores: Matrix;
  attentionWeights: Matrix;
  contextVector: Matrix;
  finalOutput: Matrix;
}