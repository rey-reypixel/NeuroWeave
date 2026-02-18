"use client";

import { useState } from "react";
import { motion } from "framer-motion";


export default function TokenizerPage() {
  const [sentence, setSentence] = useState("");
  const [tokens, setTokens] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSubwords, setUseSubwords] = useState(false);

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
    setIsProcessing(false);
  }, 500);
};

  const getTokenType = (token: string) => {
    if (/^\d+$/.test(token)) return "number";
    if (/^[a-zA-Z]+$/.test(token)) return "word";
    return "punctuation";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tokenizer Simulator</h1>

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

      {isProcessing && (
        <p className="text-gray-400 mb-4 animate-pulse">
          Processing tokens...
        </p>
      )}

      <motion.div
  key={tokens.length}
  className="flex flex-wrap gap-3"
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
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.3 }}
        className={`px-4 py-2 rounded-xl border shadow-md hover:scale-105 transition ${colorClasses}`}
      >
        {token}
      </motion.div>
    );
  })}
</motion.div>


    </div>
  );
}
