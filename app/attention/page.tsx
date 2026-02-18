"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function AttentionPage() {
  const [sentence, setSentence] = useState("");
  const [tokens, setTokens] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSubwords, setUseSubwords] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [attentionHeads, setAttentionHeads] = useState<number[][][]>([]);
  const [numHeads] = useState(3);
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [selectedHead, setSelectedHead] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headColors = ["cyan", "magenta", "lime"];

  const handleTokenize = () => {
    const cleaned = sentence.trim();
    if (!cleaned) return;

    setIsProcessing(true);

    setTimeout(() => {
      let splitTokens: string[] = cleaned.match(/\w+|[^\s\w]/g) || [];

      if (useSubwords) {
        const newTokens: string[] = [];
        splitTokens.forEach((token) => {
          if (/^[a-zA-Z]{7,}$/.test(token)) {
            const mid = Math.floor(token.length / 2);
            newTokens.push(token.slice(0, mid), "##" + token.slice(mid));
          } else {
            newTokens.push(token);
          }
        });
        splitTokens = newTokens;
      }

      setTokens(splitTokens);
      generateHeads(splitTokens.length);
      setIsProcessing(false);
    }, 500);
  };

  const generateHeads = (n: number) => {
  const heads = Array.from({ length: numHeads }, () =>
    Array.from({ length: n }, () => {
      const row = Array.from({ length: n }, () => Math.random());
      const sum = row.reduce((a, b) => a + b, 0);
      return row.map((v) => v / sum);
    })
  );
  setAttentionHeads(heads);
};

  const getTokenType = (token: string) => {
    if (/^\d+$/.test(token)) return "number";
    if (/^[a-zA-Z]+$/.test(token)) return "word";
    return "punctuation";
  };

  const getTokenCenter = (tokenIndex: number) => {
    const token = tokenRefs.current[tokenIndex];
    const container = containerRef.current;
    
    if (!token || !container) return null;
    
    const tokenRect = token.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    return {
      x: tokenRect.left - containerRect.left + tokenRect.width / 2,
      y: tokenRect.top - containerRect.top + tokenRect.height / 2
    };
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      <h1 className="text-3xl font-bold mb-6">Attention Visualization</h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder="Enter a sentence..."
          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleTokenize}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          Tokenize
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={useSubwords}
          onChange={() => setUseSubwords(!useSubwords)}
        />
        <label className="text-sm text-gray-400">
          Simulate Subword Tokenization
        </label>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 text-xs rounded ${viewMode === 'all' ? 'bg-blue-600' : 'bg-gray-700'} transition`}
          >
            All Heads
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`px-3 py-1 text-xs rounded ${viewMode === 'single' ? 'bg-blue-600' : 'bg-gray-700'} transition`}
          >
            Single Head
          </button>
        </div>
        {viewMode === 'single' && (
          <select
            value={selectedHead}
            onChange={(e) => setSelectedHead(Number(e.target.value))}
            className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded"
          >
            <option value={0}>Head 0 (Cyan)</option>
            <option value={1}>Head 1 (Magenta)</option>
            <option value={2}>Head 2 (Lime)</option>
          </select>
        )}
      </div>

      {isProcessing && (
        <p className="text-gray-400 mb-4 animate-pulse">
          Processing tokens...
        </p>
      )}

      {/* SVG for connection lines */}
      <div className="relative mb-8" ref={containerRef}>
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '300px', zIndex: 1 }}
        >
          {activeIndex !== null &&
  (viewMode === 'all' ? attentionHeads : [attentionHeads[selectedHead]]).map((headMatrix, headIndex) => {
    const actualHeadIndex = viewMode === 'all' ? headIndex : selectedHead;
    
    return headMatrix[activeIndex].map((w, j) => {
      if (!containerRef.current) return null;

      const c = containerRef.current.getBoundingClientRect();
      const s = tokenRefs.current[activeIndex]?.getBoundingClientRect();
      const t = tokenRefs.current[j]?.getBoundingClientRect();
      if (!s || !t) return null;

      const x1 = s.left - c.left + s.width / 2;
      const y1 = s.top - c.top + s.height / 2;
      const x2 = t.left - c.left + t.width / 2;
      const y2 = t.top - c.top + t.height / 2;

      let path;
      if (j === activeIndex) {
        // Self-attention: small upward loop
        const loopHeight = 60;
        path = `M ${x1} ${y1} Q ${x1 - 30} ${y1 - loopHeight} ${x1 + 30} ${y1}`;
      } else {
        // Regular attention: curved arc
        const curveHeight = 60 + actualHeadIndex * 25 + Math.abs(x2 - x1) * 0.15;
        const cx = (x1 + x2) / 2;
        const cy = Math.min(y1, y2) - curveHeight;
        path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
      }

      // Find dominant head for this token pair
      const weightsForAllHeads = attentionHeads.map(h => h[activeIndex][j]);
      const maxWeightHead = weightsForAllHeads.indexOf(Math.max(...weightsForAllHeads));
      
      // Fade non-dominant heads
      const isDominantHead = actualHeadIndex === maxWeightHead;
      const opacity = viewMode === 'all' 
        ? (isDominantHead ? Math.max(0.6, w) : w * 0.2)
        : Math.max(0.6, w);

      return (
        <motion.path
          key={`${actualHeadIndex}-${j}`}
          d={path}
          stroke={headColors[actualHeadIndex]}
          fill="transparent"
          initial={{ strokeWidth: 0 }}
          animate={{ strokeWidth: w * 20 + 1, opacity }}
          transition={{ duration: 0.3 }}
          className={`drop-shadow-[0_0_6px_${headColors[actualHeadIndex]}]`}
        />
      );
    });
  })}
        </svg>

        {/* Tokens */}
        <motion.div
          key={tokens.length}
          className="flex justify-center gap-6 relative"
          style={{ zIndex: 2, paddingTop: '100px', paddingBottom: '100px' }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
        >
          {tokens.map((token, index) => {
            const type = getTokenType(token);
            const isActive = activeIndex === index;
            const attentionWeight = activeIndex !== null ? attentionHeads[0]?.[activeIndex]?.[index] || 0 : 0;

            let colorClasses = "";
            if (type === "word")
              colorClasses = "bg-blue-600/20 border-blue-500 text-blue-300";
            else if (type === "number")
              colorClasses = "bg-green-600/20 border-green-500 text-green-300";
            else
              colorClasses = "bg-purple-600/20 border-purple-500 text-purple-300";

            if (isActive) {
              colorClasses = colorClasses.replace('600/20', '500/40').replace('border-', 'ring-2 ring-');
            }

            return (
              <motion.div
                key={index}
                ref={el => { tokenRefs.current[index] = el; }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.3 }}
                animate={{ scale: activeIndex === index ? 1.1 : 1 }}
                className={`px-4 py-2 rounded-xl border shadow-md hover:scale-105 transition cursor-pointer ${colorClasses} ${activeIndex === index ? "animate-pulse" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                style={{ position: 'relative' }}
              >
                {token}
                {isActive && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Query Token
                  </div>
                )}
                {activeIndex !== null && activeIndex !== index && attentionWeight > 0 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {(attentionWeight * 100).toFixed(1)}%
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {tokens.length > 0 && (
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-300">Multi-Head Attention:</h3>
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-2">Color Coding:</div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan rounded-full shadow-[0_0_6px_cyan]"></div>
                <span className="text-cyan">Head 0: Syntactic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-magenta rounded-full shadow-[0_0_6px_magenta]"></div>
                <span className="text-magenta">Head 1: Semantic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-lime rounded-full shadow-[0_0_6px_lime]"></div>
                <span className="text-lime">Head 2: Positional</span>
              </div>
            </div>
          </div>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• <strong>Head Specialization:</strong> Each token-to-token relation is dominated by one head (brightest)</li>
            <li>• <strong>Self-Attention:</strong> Small loops show identity preservation (i→j)</li>
            <li>• <strong>Query Token:</strong> Pulses and scales when active</li>
            <li>• <strong>View Modes:</strong> Toggle between all heads or single head focus</li>
            <li>• <strong>Visual Hierarchy:</strong> Dominant heads glow, others fade (20% opacity)</li>
            <li>• Each head row sums to 1.0 (softmax normalization)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
