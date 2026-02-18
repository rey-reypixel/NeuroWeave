'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Token {
  id: number;
  text: string;
  initialPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  previousPosition?: { x: number; y: number };
}

interface AttentionMatrix {
  [key: string]: { [key: string]: number };
}

export default function ContextPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [attentionMatrix, setAttentionMatrix] = useState<AttentionMatrix>({});
  const [isApplied, setIsApplied] = useState(false);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [maxLayers, setMaxLayers] = useState(4);
  const [isAnimating, setIsAnimating] = useState(false);
  const [inputSentence, setInputSentence] = useState('The beautiful flower so vibrant');

  // Get tokens from input
  const getTokenizedText = (text: string) => {
    return text.trim().split(/\s+/).filter(token => token.length > 0);
  };

  // Collision resolution function
  const resolveCollisions = useCallback((tokenPositions: { x: number; y: number }[]) => {
    const minDistance = 60; // Minimum distance between tokens
    const repulsionStrength = 0.5;
    const maxIterations = 10;
    
    let adjustedPositions = [...tokenPositions];
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let hasCollisions = false;
      
      for (let i = 0; i < adjustedPositions.length; i++) {
        for (let j = i + 1; j < adjustedPositions.length; j++) {
          const dx = adjustedPositions[j].x - adjustedPositions[i].x;
          const dy = adjustedPositions[j].y - adjustedPositions[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance && distance > 0) {
            hasCollisions = true;
            const force = (minDistance - distance) * repulsionStrength;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            adjustedPositions[i] = {
              ...adjustedPositions[i],
              x: Math.max(30, Math.min(470, adjustedPositions[i].x - fx)),
              y: Math.max(30, Math.min(370, adjustedPositions[i].y - fy))
            };
            
            adjustedPositions[j] = {
              ...adjustedPositions[j],
              x: Math.max(30, Math.min(470, adjustedPositions[j].x + fx)),
              y: Math.max(30, Math.min(370, adjustedPositions[j].y + fy))
            };
          }
        }
      }
      
      if (!hasCollisions) break;
    }
    
    return adjustedPositions;
  }, []);

  // Initialize tokens with random positions
  useEffect(() => {
    const currentTokens = getTokenizedText(inputSentence);
    if (currentTokens.length === 0) return;
    
    const initialPositions = currentTokens.map(() => ({
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50
    }));
    
    const resolvedPositions = resolveCollisions(initialPositions);
    
    const initialTokens: Token[] = currentTokens.map((text, i) => ({
      id: i,
      text,
      initialPosition: resolvedPositions[i],
      currentPosition: resolvedPositions[i]
    }));
    setTokens(initialTokens);
  }, [inputSentence, resolveCollisions]);

  // Generate sample attention matrix
  const generateAttentionMatrix = () => {
    const currentTokens = getTokenizedText(inputSentence);
    const matrix: AttentionMatrix = {};
    currentTokens.forEach((token: string, i: number) => {
      matrix[i] = {};
      currentTokens.forEach((otherToken: string, j: number) => {
        // Simulate attention weights (higher for semantically related tokens)
        let weight = Math.random() * 0.3;
        
        // Add some semantic relationships for common words
        const semanticPairs: { [key: string]: string[] } = {
          'beautiful': ['flower', 'vibrant', 'colorful', 'amazing'],
          'flower': ['beautiful', 'vibrant', 'petal', 'bloom'],
          'so': ['vibrant', 'beautiful', 'very', 'really'],
          'vibrant': ['beautiful', 'flower', 'colorful', 'bright'],
          'the': [], // Function words get lower base weights
          'a': [],
          'an': [],
          'and': [],
          'but': [],
          'or': [],
          'in': [],
          'on': [],
          'at': [],
          'to': [],
          'for': []
        };
        
        if (semanticPairs[token]?.includes(otherToken)) {
          weight += 0.4;
        }
        
        // Normalize
        matrix[i][j] = weight;
      });
    });
    
    // Normalize rows to sum to 1
    Object.keys(matrix).forEach(i => {
      const rowSum = Object.values(matrix[i]).reduce((sum, val) => sum + val, 0);
      Object.keys(matrix[i]).forEach(j => {
        matrix[i][j] = matrix[i][j] / rowSum;
      });
    });
    
    return matrix;
  };

  // Apply attention with multi-layer support
  const applyAttentionLayer = useCallback(async (layerCount: number) => {
    setIsAnimating(true);
    const matrix = generateAttentionMatrix();
    setAttentionMatrix(matrix);
    
    let currentTokens = [...tokens];
    
    for (let layer = 1; layer <= layerCount; layer++) {
      await new Promise(resolve => setTimeout(resolve, 600)); // Wait for animation
      
      const updatedTokens = currentTokens.map((token, i) => {
        let newX = 0;
        let newY = 0;
        
        // newPosition = attention × currentPosition
        Object.keys(matrix[i]).forEach(j => {
          const jIndex = parseInt(j);
          const weight = matrix[i][j];
          newX += weight * currentTokens[jIndex].currentPosition.x;
          newY += weight * currentTokens[jIndex].currentPosition.y;
        });
        
        return {
          ...token,
          previousPosition: token.currentPosition,
          currentPosition: { x: newX, y: newY }
        };
      });
      
      // Apply collision resolution
      const positions = updatedTokens.map(t => t.currentPosition);
      const resolvedPositions = resolveCollisions(positions);
      
      currentTokens = updatedTokens.map((token, i) => ({
        ...token,
        currentPosition: resolvedPositions[i]
      }));
      
      setTokens([...currentTokens]);
      setCurrentLayer(layer);
    }
    
    setIsAnimating(false);
  }, [tokens, resolveCollisions]);

  // Apply attention (single layer)
  const applyAttention = () => {
    if (!isApplied) {
      applyAttentionLayer(1);
      setIsApplied(true);
    }
  };

  // Reset to initial positions
  const resetPositions = () => {
    setTokens(tokens.map(token => ({
      ...token,
      currentPosition: token.initialPosition,
      previousPosition: undefined
    })));
    setIsApplied(false);
    setCurrentLayer(0);
    setSelectedToken(null);
  };

  // Handle sentence input change
  const handleSentenceChange = (newSentence: string) => {
    setInputSentence(newSentence);
    setIsApplied(false);
    setCurrentLayer(0);
    setSelectedToken(null);
  };

  // Get attention weights for selected token
  const getAttentionWeights = (tokenId: number) => {
    if (!attentionMatrix[tokenId]) return [];
    return Object.entries(attentionMatrix[tokenId]).map(([j, weight]) => ({
      tokenId: parseInt(j),
      weight,
      token: tokens[parseInt(j)]?.text || ''
    })).sort((a, b) => b.weight - a.weight);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Context & Attention Visualization</h1>
          <p className="text-gray-300 mb-6">
            See how tokens shift positions when attention is applied. Tokens move closer to semantically related tokens.
          </p>
          
          {/* Input Section */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              Enter your sentence:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={inputSentence}
                onChange={(e) => handleSentenceChange(e.target.value)}
                placeholder="Type a sentence to visualize..."
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={isAnimating}
              />
              <button
                onClick={() => handleSentenceChange(inputSentence)}
                disabled={isAnimating || inputSentence.trim().length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Tokenize
              </button>
            </div>
            {tokens.length > 0 && (
              <div className="mt-2 text-sm text-gray-400">
                Tokens: {tokens.map(t => t.text).join(' • ')}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={applyAttention}
              disabled={isApplied || isAnimating || tokens.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Apply Attention
            </button>
            <button
              onClick={resetPositions}
              disabled={isAnimating || tokens.length === 0}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
            >
              Reset Positions
            </button>
            
            {/* Multi-layer controls */}
            <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg">
              <label className="text-white text-sm">Layers:</label>
              <input
                type="range"
                min="1"
                max="4"
                value={maxLayers}
                onChange={(e) => setMaxLayers(parseInt(e.target.value))}
                disabled={isAnimating}
                className="w-24"
              />
              <button
                onClick={() => {
                  resetPositions();
                  setTimeout(() => applyAttentionLayer(maxLayers), 100);
                }}
                disabled={isAnimating || tokens.length === 0}
                className="px-4 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-600 text-sm transition-colors"
              >
                Apply {maxLayers} Layers
              </button>
            </div>
            
            {currentLayer > 0 && (
              <div className="flex items-center gap-2 text-white bg-slate-800 px-4 py-2 rounded-lg">
                <span className="text-sm">Current Layer: {currentLayer}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Before Panel */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Before Attention</h2>
            <div className="relative bg-slate-900 rounded-lg" style={{ height: '400px' }}>
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern id="grid-left" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-left)" />
              </svg>
              
              {/* Initial tokens */}
              {tokens.map((token) => (
                <div
                  key={`initial-${token.id}`}
                  className="absolute w-16 h-16 flex items-center justify-center"
                  style={{
                    left: `${token.initialPosition.x - 30}px`,
                    top: `${token.initialPosition.y - 30}px`
                  }}
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-medium bg-slate-700 text-gray-200 border-2 border-slate-600">
                    {token.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* After Panel */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              After Attention {currentLayer > 0 && `(Layer ${currentLayer})`}
            </h2>
            <div className="relative bg-slate-900 rounded-lg" style={{ height: '400px' }}>
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern id="grid-right" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-right)" />
                
                {/* Transformation lines */}
                {isApplied && tokens.map((token) => (
                  <line
                    key={`transform-${token.id}`}
                    x1={token.initialPosition.x}
                    y1={token.initialPosition.y}
                    x2={token.currentPosition.x}
                    y2={token.currentPosition.y}
                    stroke="rgba(59, 130, 246, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                ))}
                
                {/* Connection lines for selected token */}
                {selectedToken !== null && isApplied && (
                  <g>
                    {tokens.map((token, j) => {
                      if (j === selectedToken) return null;
                      const weight = attentionMatrix[selectedToken]?.[j] || 0;
                      if (weight < 0.1) return null;
                      
                      return (
                        <line
                          key={`line-${selectedToken}-${j}`}
                          x1={tokens[selectedToken].currentPosition.x}
                          y1={tokens[selectedToken].currentPosition.y}
                          x2={token.currentPosition.x}
                          y2={token.currentPosition.y}
                          stroke="rgba(59, 130, 246, 0.5)"
                          strokeWidth={weight * 3}
                          strokeOpacity={weight}
                        />
                      );
                    })}
                  </g>
                )}
              </svg>
              
              {/* Animated tokens */}
              <AnimatePresence>
                {tokens.map((token) => (
                  <motion.div
                    key={`after-${token.id}`}
                    initial={false}
                    animate={{
                      x: token.currentPosition.x - 30,
                      y: token.currentPosition.y - 30,
                      scale: selectedToken === token.id ? 1.2 : 1
                    }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    className="absolute w-16 h-16 flex items-center justify-center cursor-pointer"
                    onClick={() => setSelectedToken(token.id)}
                  >
                    <div className={`
                      w-14 h-14 rounded-full flex items-center justify-center text-sm font-medium
                      transition-all duration-200 border-2
                      ${selectedToken === token.id 
                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/50' 
                        : 'bg-slate-700 text-gray-200 border-slate-600 hover:bg-slate-600'
                      }
                    `}>
                      {token.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attention Weights Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Attention Weights</h2>
              {selectedToken !== null && isApplied ? (
                <div>
                  <p className="text-gray-300 mb-3">
                    From: <span className="text-blue-400 font-medium">{tokens[selectedToken]?.text}</span>
                  </p>
                  <div className="space-y-2">
                    {getAttentionWeights(selectedToken).map(({ tokenId, weight, token }) => (
                      <div key={tokenId} className="flex items-center justify-between">
                        <span className="text-gray-200">{token}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${weight * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-sm w-12 text-right">
                            {weight.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">
                  {isApplied 
                    ? 'Click on a token to see its attention weights'
                    : 'Apply attention to see token relationships'
                  }
                </p>
              )}
            </div>

            {/* Info Panel */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">How it works</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Tokens start at random positions</li>
                <li>• Attention matrix shows relationships</li>
                <li>• New position = Σ(attention × position)</li>
                <li>• Related tokens cluster together</li>
                <li>• Multiple layers deepen clustering</li>
                <li>• Collision resolution prevents overlap</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
