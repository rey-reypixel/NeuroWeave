import { useState } from 'react';
import axios from 'axios';
import { MatrixVisualizer } from './MatrixVisualizer';

export function Arena() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [tensors, setTensors] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameMode, setGameMode] = useState<'bounty' | 'detective' | 'fixer'>('bounty');
  const [blindData, setBlindData] = useState<any>(null);
  const [guess, setGuess] = useState("");
  const [guessResult, setGuessResult] = useState<{correct: boolean, message: string} | null>(null);
  const [fixerData, setFixerData] = useState<any>(null);
  const [fixerSentence, setFixerSentence] = useState("Break the matrix");
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosisResult, setDiagnosisResult] = useState<{correct: boolean, message: string} | null>(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/v1/arena/submit', {
        text: input,
        dimension: 4
      });
      setResult(res.data);
      setTensors(res.data.tensors);
    } catch (e) {
      console.error("Arena submission failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetectiveGame = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/arena/detective/start');
      setBlindData(res.data);
    } catch (e) {
      console.error("Detective game fetch failed", e);
    }
  };

  const submitGuess = async () => {
    if (!guess) return;
    try {
      const res = await axios.post(`http://localhost:8000/api/v1/arena/detective/guess?guess=${guess}`);
      setGuessResult(res.data);
    } catch (e) {
      console.error("Failed to submit guess", e);
    }
  };

  const startFixer = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/arena/fixer/start?sentence=${fixerSentence}`);
      setFixerData(res.data);
    } catch (e) {
      console.error("Failed to start fixer game", e);
    }
  };

  const submitDiagnosis = async () => {
    if (!diagnosis) return;
    try {
      const res = await axios.post(`http://localhost:8000/api/v1/arena/fixer/diagnose?diagnosis=${encodeURIComponent(diagnosis)}`);
      setDiagnosisResult(res.data);
    } catch (e) {
      console.error("Failed to submit diagnosis", e);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ff9e64', borderRadius: '12px', backgroundColor: 'rgba(255, 158, 100, 0.05)' }}>
      <select 
        value={gameMode} 
        onChange={(e) => setGameMode(e.target.value as any)}
        style={{ padding: '10px', background: '#1a1b26', color: '#ff9e64', border: '1px solid #ff9e64', borderRadius: '8px', marginBottom: '20px' }}
      >
        <option value="bounty">Target: Saturate the Softmax</option>
        <option value="detective">Target: Attention Detective</option>
        <option value="fixer">Target: Architecture Fixer</option>
      </select>

      {gameMode === 'bounty' ? (
        <>
          <h2 style={{ color: '#ff9e64', marginTop: 0 }}>Active Bounty: Saturate the Softmax</h2>
          <p style={{ color: '#c0caf5' }}>
            <strong>Objective:</strong> Construct an input sentence that forces a single word to receive &gt;95% of the attention weight. 
          </p>
          
          <div style={{ marginTop: '20px' }}>
            <input 
              type="text"
              placeholder="Enter your sentence..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={{ 
                width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ff9e64',
                backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '0.9rem', outline: 'none'
              }}
            />
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              style={{ 
                marginTop: '10px', padding: '10px 20px', borderRadius: '8px', border: 'none',
                backgroundColor: '#ff9e64', color: '#1a1b26', fontWeight: 'bold', cursor: 'pointer',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              {isLoading ? 'Processing...' : 'Submit to Arena'}
            </button>
          </div>
        </>
      ) : (
        <div>
          <h2 style={{ color: '#ff9e64', marginTop: 0 }}>Active Bounty: Blind Matrix</h2>
          <p style={{ color: '#c0caf5' }}>
            <strong>Objective:</strong> Read the attention weights to deduce the hidden sentence. 
          </p>
          <button 
            onClick={fetchDetectiveGame}
            style={{ 
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: '#ff9e64', color: '#1a1b26', fontWeight: 'bold', cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            Generate New Puzzle
          </button>

          {blindData && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#c0caf5' }}><strong>Clue:</strong> {blindData.hint}</p>
              
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <MatrixVisualizer 
                  title="Attention Weights" 
                  data={blindData.attention_weights} 
                  rowLabels={blindData.labels}
                  colLabels={blindData.labels}
                  isHeatmap={true} 
                />
              </div>

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="text" 
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Guess the exact sentence..." 
                  style={{ padding: '10px', background: 'transparent', color: '#c0caf5', border: '1px solid #ff9e64', borderRadius: '4px' }}
                />
                <button 
                  onClick={submitGuess}
                  style={{ padding: '10px', background: '#ff9e64', color: '#1a1b26', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '150px' }}
                >
                  Submit Guess
                </button>

                {/* This is the part that was missing! Rendering the result: */}
                {guessResult && (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '15px', 
                    backgroundColor: guessResult.correct ? 'rgba(158, 206, 106, 0.1)' : 'rgba(247, 118, 142, 0.1)', 
                    borderLeft: `4px solid ${guessResult.correct ? '#9ece6a' : '#f7768e'}` 
                  }}>
                    <h3 style={{ color: guessResult.correct ? '#9ece6a' : '#f7768e', margin: '0 0 5px 0' }}>
                      {guessResult.correct ? '🎯 BOUNTY CLAIMED!' : '❌ INCORRECT'}
                    </h3>
                    <p style={{ margin: 0, color: '#c0caf5' }}>{guessResult.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {gameMode === 'fixer' && (
        <div>
          <h2 style={{ color: '#f7768e', marginTop: 0 }}>CRITICAL ERROR: Architecture Unstable</h2>
          <p style={{ color: '#c0caf5' }}>
            <strong>Objective:</strong> Analyze the broken tensors below and diagnose the missing mathematical step.
          </p>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={fixerSentence}
              onChange={(e) => setFixerSentence(e.target.value)}
              placeholder="Enter a sentence to test..." 
              style={{ padding: '10px', background: 'transparent', color: '#c0caf5', border: '1px solid #f7768e', borderRadius: '4px' }} 
            />
            <button 
              onClick={startFixer}
              style={{ padding: '10px', background: '#f7768e', color: '#1a1b26', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Deploy Bugged Code
            </button>
          </div>

          {fixerData && (
            <>
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'rgba(247, 118, 142, 0.1)', border: '1px solid #f7768e', borderRadius: '8px' }}>
                <h3 style={{ color: '#f7768e', margin: '0 0 10px 0' }}>System Alert: {fixerData.message}</h3>
                <p style={{ color: '#c0caf5', margin: '0 0 15px 0' }}><strong>Hint:</strong> {fixerData.hint}</p>
                
                <MatrixVisualizer 
                  title="Bugged Attention Weights" 
                  data={fixerData.tensors.attention_weights} 
                  rowLabels={fixerData.tensors.raw_scores.map((_: any, i: number) => `Token ${i+1}`)}
                  colLabels={fixerData.tensors.raw_scores.map((_: any, i: number) => `Token ${i+1}`)}
                  isHeatmap={true} 
                />
              </div>

              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'rgba(247, 118, 142, 0.1)', border: '1px solid #f7768e', borderRadius: '8px' }}>
                <h3 style={{ color: '#f7768e', margin: '0 0 10px 0' }}>Terminal: Submit Diagnosis</h3>
                <input 
                  type="text" 
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g., 'You forgot to apply the causal mask'" 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    background: 'transparent', 
                    color: '#c0caf5', 
                    border: '1px solid #565f89', 
                    borderRadius: '4px', 
                    marginBottom: '10px' 
                  }} 
                />
                <button 
                  onClick={submitDiagnosis}
                  style={{ padding: '10px', background: '#7aa2f7', color: '#1a1b26', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Push Fix
                </button>

                {diagnosisResult && (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '15px', 
                    backgroundColor: diagnosisResult.correct ? 'rgba(158, 206, 106, 0.1)' : 'rgba(247, 118, 142, 0.1)', 
                    borderLeft: `4px solid ${diagnosisResult.correct ? '#9ece6a' : '#f7768e'}` 
                  }}>
                    <h3 style={{ color: diagnosisResult.correct ? '#9ece6a' : '#f7768e', margin: '0 0 5px 0' }}>
                      {diagnosisResult.correct ? '🎯 DIAGNOSIS CONFIRMED!' : '❌ INCORRECT DIAGNOSIS'}
                    </h3>
                    <p style={{ margin: 0, color: '#c0caf5' }}>{diagnosisResult.message}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Only show the Bounty visualizer if we are in Bounty mode! */}
      {gameMode === 'bounty' && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          {tensors && tensors.attention_weights ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <h3 style={{ color: '#7dcfff', margin: 0 }}>Attention Weights (Visual Proof)</h3>
              <p style={{ color: '#9ece6a', fontSize: '0.85rem' }}>Look at those saturated values!</p>
              {/* Render your matrix component here, passing the attention_weights */}
              <MatrixVisualizer title="Attention Weights" data={tensors.attention_weights} isHeatmap={true} /> 
            </div>
          ) : (
            <p style={{ color: '#565f89', textAlign: 'center' }}>[ Run a sentence to generate tensors ]</p>
          )}
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <h4 style={{ color: result.won ? '#9ece6a' : '#ff757f', margin: '0 0 10px 0' }}>
            {result.won ? '🎯 BOUNTY CLAIMED!' : '⚔️ Keep Fighting!'}
          </h4>
          <p style={{ color: '#c0caf5', margin: '0' }}>
            {result.message}
          </p>
          <p style={{ color: '#7aa2f7', margin: '10px 0 0 0', fontSize: '0.9rem' }}>
            Max Attention: {(result.max_attention * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}
