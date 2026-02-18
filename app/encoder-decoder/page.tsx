"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function EncoderDecoderPage() {
  const [inputSentence, setInputSentence] = useState("");
  const [encoderTokens, setEncoderTokens] = useState<string[]>([]);
  const [decoderTokens, setDecoderTokens] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [crossAttentionWeights, setCrossAttentionWeights] = useState<number[][]>([]);
  const [activeDecoderIndex, setActiveDecoderIndex] = useState<number | null>(null);
  
  const encoderContainerRef = useRef<HTMLDivElement>(null);
  const decoderContainerRef = useRef<HTMLDivElement>(null);
  const encoderTokenRefs = useRef<(HTMLDivElement | null)[]>([]);
  const decoderTokenRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mock output pairs with more flexible matching
  const mockOutputs: Record<string, string[]> = {
    "The flower is so beautiful.": ["It", "looks", "vibrant", "."],
    "The flower is beautiful.": ["It", "looks", "vibrant", "."],
    "The Flower is beautiful.": ["It", "looks", "vibrant", "."],
    "The cat sits on the mat.": ["A", "feline", "rests", "there", "."],
    "I love programming.": ["Coding", "is", "my", "passion", "."],
    "default": ["This", "is", "a", "response", "."]
  };

  const handleEncode = () => {
    const cleaned = inputSentence.trim();
    if (!cleaned) return;

    setIsProcessing(true);
    setDecoderTokens([]);
    setCurrentStep(0);

    setTimeout(() => {
      const tokens = cleaned.match(/\w+|[^\s\w]/g) || [];
      setEncoderTokens(tokens);
      generateCrossAttention(tokens.length);
      setIsProcessing(false);
    }, 500);
  };

  const generateCrossAttention = (encoderLength: number) => {
    // Generate mock cross-attention weights for each potential decoder token
    const maxDecoderTokens = 10;
    const weights = Array.from({ length: maxDecoderTokens }, () => {
      const row = Array.from({ length: encoderLength }, () => Math.random());
      const sum = row.reduce((a, b) => a + b, 0);
      return row.map((v) => v / sum);
    });
    setCrossAttentionWeights(weights);
  };

  const handleGenerateNextToken = () => {
    // Try exact match first
    let mockOutput = mockOutputs[inputSentence.trim()];
    
    // If no exact match, try semantic matching
    if (!mockOutput) {
      const lowerInput = inputSentence.toLowerCase();
      if (lowerInput.includes("flower") || lowerInput.includes("beautiful")) {
        mockOutput = ["It", "looks", "vibrant", "."];
      } else if (lowerInput.includes("cat") || lowerInput.includes("mat")) {
        mockOutput = ["A", "feline", "rests", "there", "."];
      } else if (lowerInput.includes("programming") || lowerInput.includes("coding")) {
        mockOutput = ["Coding", "is", "my", "passion", "."];
      } else {
        mockOutput = mockOutputs.default;
      }
    }
    
    if (currentStep < mockOutput.length) {
      const newToken = mockOutput[currentStep];
      setDecoderTokens(prev => [...prev, newToken]);
      setCurrentStep(prev => prev + 1);
      
      // Auto-activate the newly added token
      setTimeout(() => {
        setActiveDecoderIndex(currentStep);
      }, 100);
    }
  };

  const handleReset = () => {
    setInputSentence("");
    setEncoderTokens([]);
    setDecoderTokens([]);
    setCurrentStep(0);
    setActiveDecoderIndex(null);
    setCrossAttentionWeights([]);
  };

  const getTokenType = (token: string) => {
    if (/^\d+$/.test(token)) return "number";
    if (/^[a-zA-Z]+$/.test(token)) return "word";
    return "punctuation";
  };

  const getTokenCenter = (tokenIndex: number, isEncoder: boolean) => {
    const token = isEncoder ? encoderTokenRefs.current[tokenIndex] : decoderTokenRefs.current[tokenIndex];
    const container = isEncoder ? encoderContainerRef.current : decoderContainerRef.current;
    
    if (!token || !container) return null;
    
    const tokenRect = token.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    return {
      x: tokenRect.left - containerRect.left + tokenRect.width / 2,
      y: tokenRect.top - containerRect.top + tokenRect.height / 2
    };
  };

  const drawCrossAttentionArcs = () => {
    if (activeDecoderIndex === null || encoderTokens.length === 0) return [];

    const arcs: Array<{
      path: string;
      weight: number;
      encoderIndex: number;
      decoderIndex: number;
    }> = [];
    const decoderCenter = getTokenCenter(activeDecoderIndex, false);
    
    if (!decoderCenter || !encoderContainerRef.current) return arcs;

    const containerRect = encoderContainerRef.current.getBoundingClientRect();

    encoderTokens.forEach((_, encoderIndex) => {
      const encoderCenter = getTokenCenter(encoderIndex, true);
      if (!encoderCenter) return;

      const weight = crossAttentionWeights[activeDecoderIndex]?.[encoderIndex] || 0;
      
      // Create curved path from decoder to encoder
      const startX = decoderCenter.x;
      const startY = decoderCenter.y;
      const endX = encoderCenter.x;
      const endY = encoderCenter.y + 200; // Offset for encoder being below
      
      const curveHeight = 80 + Math.abs(endX - startX) * 0.1;
      const cx = (startX + endX) / 2;
      const cy = Math.min(startY, endY) - curveHeight;
      
      const path = `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`;

      arcs.push({
        path,
        weight,
        encoderIndex,
        decoderIndex: activeDecoderIndex
      });
    });

    return arcs;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Encoder-Decoder Architecture</h1>

      {/* Input Section */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={inputSentence}
          onChange={(e) => setInputSentence(e.target.value)}
          placeholder="Enter input sentence (e.g., 'The flower is so beautiful.')"
          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleEncode}
          disabled={isProcessing}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition"
        >
          {isProcessing ? "Encoding..." : "Encode"}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
        >
          Reset
        </button>
      </div>

      {/* Generation Controls */}
      {encoderTokens.length > 0 && (
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerateNextToken}
              disabled={currentStep >= (mockOutputs[inputSentence.trim()] || mockOutputs.default).length}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded-lg transition"
            >
              Generate Next Token
            </button>
            <span className="text-sm text-gray-400">
              Step: {currentStep} / {(mockOutputs[inputSentence.trim()] || mockOutputs.default).length}
            </span>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Encoder Side */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-blue-400 mb-2">Encoder</h2>
            <p className="text-sm text-gray-400">Builds contextual representations</p>
          </div>
          
          <div className="relative bg-gray-800/30 rounded-lg p-6 min-h-[300px]" ref={encoderContainerRef}>
            {encoderTokens.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-500">
                Enter a sentence and click Encode
              </div>
            ) : (
              <motion.div
                className="flex justify-center gap-4 flex-wrap"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                {encoderTokens.map((token, index) => {
                  const type = getTokenType(token);
                  let colorClasses = "";
                  if (type === "word")
                    colorClasses = "bg-blue-600/20 border-blue-500 text-blue-300";
                  else if (type === "number")
                    colorClasses = "bg-green-600/20 border-green-500 text-green-300";
                  else
                    colorClasses = "bg-purple-600/20 border-purple-500 text-purple-300";

                  return (
                    <motion.div
                      key={index}
                      ref={el => { encoderTokenRefs.current[index] = el; }}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      className={`px-3 py-2 rounded-lg border ${colorClasses}`}
                    >
                      {token}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>

        {/* Decoder Side */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-orange-400 mb-2">Decoder</h2>
            <p className="text-sm text-gray-400">Generates output one token at a time</p>
          </div>
          
          <div className="relative bg-gray-800/30 rounded-lg p-6 min-h-[300px]" ref={decoderContainerRef}>
            {decoderTokens.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-500">
                Click "Generate Next Token" to start decoding
              </div>
            ) : (
              <motion.div
                className="flex justify-center gap-4 flex-wrap"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                {decoderTokens.map((token, index) => {
                  const isActive = activeDecoderIndex === index;
                  return (
                    <motion.div
                      key={index}
                      ref={el => { decoderTokenRefs.current[index] = el; }}
                      variants={{
                        hidden: { opacity: 0, y: -20 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      animate={{ scale: isActive ? 1.1 : 1 }}
                      className={`px-3 py-2 rounded-lg border bg-orange-600/20 border-orange-500 text-orange-300 cursor-pointer hover:scale-105 transition ${isActive ? "ring-2 ring-orange-400 animate-pulse" : ""}`}
                      onMouseEnter={() => setActiveDecoderIndex(index)}
                      onMouseLeave={() => setActiveDecoderIndex(null)}
                    >
                      {token}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Attention Visualization */}
      {activeDecoderIndex !== null && encoderTokens.length > 0 && (
        <div className="mt-8 relative">
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '400px', zIndex: 10 }}
          >
            {drawCrossAttentionArcs().map((arc, index) => (
              <motion.path
                key={index}
                d={arc.path}
                stroke="orange"
                fill="transparent"
                initial={{ strokeWidth: 0, opacity: 0 }}
                animate={{ 
                  strokeWidth: arc.weight * 15 + 1, 
                  opacity: Math.max(0.3, arc.weight) 
                }}
                transition={{ duration: 0.5 }}
                className="drop-shadow-[0_0_8px_orange]"
              />
            ))}
          </svg>
        </div>
      )}

      {/* Info Panel */}
      {encoderTokens.length > 0 && (
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-300">Cross-Attention Visualization:</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• <strong>Orange Arcs:</strong> Show cross-attention from active decoder token to encoder tokens</li>
            <li>• <strong>Token Generation:</strong> Click "Generate Next Token" to add decoder tokens one by one</li>
            <li>• <strong>Interactive:</strong> Hover over decoder tokens to see their attention patterns</li>
            <li>• <strong>Mock Outputs:</strong> Predefined responses for demonstration (no actual ML)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
