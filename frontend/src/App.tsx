// frontend/src/App.tsx
import { useState } from 'react';
import { useModelStore } from './store/useModelStore';
import { MatrixVisualizer } from './components/ui/MatrixVisualizer';
import { CopilotChat } from './components/ui/CopilotChat';
import { TransformerInput } from './components/ui/TransformerInput';
import { HeadSelector } from './components/ui/HeadSelector';
import { TeacherDashboard } from './components/ui/TeacherDashboard';
import { StudentProgress } from './components/ui/StudentProgress';
import { Arena } from './components/ui/Arena';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'arena'>('sandbox');
  const viewMode = useModelStore((state) => state.viewMode);
  const toggleView = useModelStore((state) => state.toggleView);
  const heads = useModelStore((state) => state.heads);
  const activeHeadIndex = useModelStore((state) => state.activeHeadIndex);
  const isLoading = useModelStore((state) => state.isLoading);

  const currentAttention = heads ? heads[activeHeadIndex] : null;
  const wordLabels = currentAttention?.tokens.map(t => t.text);
  
  return (
    <div style={{ 
      padding: '40px', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', 
      background: 'radial-gradient(circle at top center, #1a1b26 0%, #0f0f14 100%)', 
      fontFamily: "'Inter', sans-serif", color: '#e2e8f0'
    }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: '0', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', color: 'white' }}>
            Neuro<span style={{ color: '#a9b1d6' }}>Weave</span>
          </h1>
          <p style={{ margin: '0', color: '#737aa2', fontSize: '1rem', fontStyle: 'italic' }}>
            You just want Attention.... and maybe a little Socratic AI on the side.
          </p>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={() => setActiveTab('sandbox')}
              style={{ padding: '8px 16px', background: activeTab === 'sandbox' ? '#7aa2f7' : 'transparent', color: activeTab === 'sandbox' ? '#1a1b26' : '#7aa2f7', border: '1px solid #7aa2f7', borderRadius: '4px' }}
            >
              Lab / Sandbox
            </button>
            <button 
              onClick={() => setActiveTab('arena')}
              style={{ padding: '8px 16px', background: activeTab === 'arena' ? '#ff9e64' : 'transparent', color: activeTab === 'arena' ? '#1a1b26' : '#ff9e64', border: '1px solid #ff9e64', borderRadius: '4px' }}
            >
              ⚔️ The Arena
            </button>
          </div>
        </div>
        
        <button 
          onClick={toggleView}
          style={{ 
            padding: '8px 16px', backgroundColor: 'rgba(122, 162, 247, 0.1)', 
            border: '1px solid #7aa2f7', color: '#7aa2f7', borderRadius: '20px', 
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'
          }}
        >
          {viewMode === 'student' ? 'VIEW ANALYTICS (TEACHER)' : 'BACK TO SANDBOX (STUDENT)'}
        </button>
      </div>

      {/* BRANCHING LOGIC: TEACHER vs STUDENT */}
      {viewMode === 'teacher' ? (
        <TeacherDashboard />
      ) : (
        <>
          {activeTab === 'sandbox' ? (
            <>
              <StudentProgress />
              <TransformerInput />

              {!currentAttention && !isLoading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                  <h2 style={{ color: '#444' }}>Input a sentence to ignite the Transformer engine.</h2>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '40px', flex: 1, minHeight: 0 }}>
                  <div style={{ flex: 2, overflowY: 'auto', paddingRight: '15px' }}>
                    {isLoading ? (
                      <h2 style={{ color: '#00c853' }}>Processing NumPy Tensors...</h2>
                    ) : (
                      <>
                        <HeadSelector /> 
                        {/* Pipeline Step 1 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                          <MatrixVisualizer title="Word Embeddings" data={currentAttention!.embeddings} rowLabels={wordLabels} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ color: '#7aa2f7', fontSize: '1.5rem', fontWeight: 'bold' }}>+</div>
                            <MatrixVisualizer title="Positional Encoding" data={currentAttention!.positionalEncoding} rowLabels={wordLabels} />
                          </div>
                        </div>
                        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', margin: '20px 0 40px 0' }}></div>
                        {/* Pipeline Step 2 & 3 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
                          <MatrixVisualizer title="Query (Q)" data={currentAttention!.queries} rowLabels={wordLabels} />
                          <MatrixVisualizer title="Key (K)" data={currentAttention!.keys} rowLabels={wordLabels} />
                          <MatrixVisualizer title="Value (V)" data={currentAttention!.values} rowLabels={wordLabels} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                          <MatrixVisualizer title="Raw Scores" data={currentAttention!.rawScores} rowLabels={wordLabels} colLabels={wordLabels} />
                          <div style={{ color: '#7aa2f7', fontSize: '1.2rem', fontWeight: 'bold' }}>→ Softmax →</div>
                          <MatrixVisualizer title="Attention Weights" data={currentAttention!.attentionWeights} isHeatmap={true} rowLabels={wordLabels} colLabels={wordLabels} />
                        </div>
                        
                        {/* Masking & Softmax Section */}
                        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', margin: '20px 0 40px 0' }}></div>
                        <div style={{ marginBottom: '40px' }}>
                          <h4 style={{ color: '#7aa2f7', fontSize: '1rem', marginBottom: '20px' }}>Masking & Softmax Transformation</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                            <MatrixVisualizer title="Raw Scores (QK^T)" data={currentAttention!.rawScores} rowLabels={wordLabels} colLabels={wordLabels} />
                            <div style={{ color: '#ff757f', fontSize: '1.2rem', fontWeight: 'bold' }}>+ Mask →</div>
                            <MatrixVisualizer title="Masked Scores" data={currentAttention!.maskedScores} rowLabels={wordLabels} colLabels={wordLabels} />
                            <div style={{ color: '#7aa2f7', fontSize: '1.2rem', fontWeight: 'bold' }}>→ Softmax →</div>
                            <MatrixVisualizer title="Attention Weights" data={currentAttention!.attentionWeights} isHeatmap={true} rowLabels={wordLabels} colLabels={wordLabels} />
                          </div>
                        </div>
                        
                        {/* Feed Forward Section */}
                        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', margin: '20px 0 40px 0' }}></div>
                        <div style={{ marginBottom: '40px' }}>
                          <h4 style={{ color: '#7aa2f7', fontSize: '1rem', marginBottom: '20px' }}>Feed Forward Network</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                            <MatrixVisualizer title="Context Vector" data={currentAttention!.contextVector} rowLabels={wordLabels} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                              <div style={{ color: '#9ece6a', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>
                                Dense Layer<br/>(Expand) + ReLU
                              </div>
                              <div style={{ color: '#7aa2f7', fontSize: '1.5rem' }}>→</div>
                            </div>
                            <div style={{ 
                              backgroundColor: 'rgba(158, 206, 106, 0.1)', 
                              border: '1px solid #9ece6a', 
                              borderRadius: '8px', 
                              padding: '20px', 
                              minWidth: '150px',
                              textAlign: 'center',
                              color: '#9ece6a',
                              fontSize: '0.8rem'
                            }}>
                              Expanded<br/>dim * 4
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                              <div style={{ color: '#9ece6a', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>
                                Dense Layer<br/>(Compress)
                              </div>
                              <div style={{ color: '#7aa2f7', fontSize: '1.5rem' }}>→</div>
                            </div>
                            <MatrixVisualizer title="Final Output" data={currentAttention!.finalOutput} rowLabels={wordLabels} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: '350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <CopilotChat />
                  </div>
                </div>
              )}
            </>
          ) : (
            <Arena />
          )}
        </>
      )}
    </div>
  );
}