// frontend/src/components/ui/TransformerInput.tsx
import { useState } from 'react';
import { useModelStore } from '../../store/useModelStore';

export function TransformerInput() {
  const [text, setText] = useState('');
  const calculate = useModelStore((state) => state.calculateAttention);
  const isLoading = useModelStore((state) => state.isLoading);
  const dimension = useModelStore((state) => state.dimension);
  const setDimension = useModelStore((state) => state.setDimension);
  // Added e.preventDefault() to absolutely stop ghost page reloads
  const handleRun = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault(); 
    if (text.trim()) calculate(text);
  };

  return (
   <div style={{ 
      display: 'flex', gap: '10px', marginBottom: '30px', padding: '20px', 
      // GLASS EFFECT
      backgroundColor: 'rgba(255, 255, 255, 0.03)', 
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.08)', 
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
    }}>
      <input 
        type="text" 
        placeholder="Enter a sentence to visualize attention..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRun(e)}
        style={{ 
          flex: 1, padding: '12px 20px', borderRadius: '8px', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)', // Darker inner glass
          color: 'white', fontSize: '1rem', outline: 'none',
          fontFamily: "'Inter', sans-serif"
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
  <label style={{ fontSize: '0.7rem', color: '#7aa2f7', marginBottom: '5px' }}>
    Dimension: {dimension}
  </label>
  <input 
    type="range" min="2" max="12" step="2"
    value={dimension}
    onChange={(e) => setDimension(Number(e.target.value))}
    style={{ cursor: 'pointer', accentColor: '#00c853' }}
  />
</div>
      <button 
        onClick={handleRun}
        disabled={isLoading}
        type="button" // Forces the browser to not treat this as a submit button
        style={{ 
          padding: '0 25px', borderRadius: '4px', border: 'none',
          backgroundColor: '#00c853', color: 'black', fontWeight: 'bold', cursor: 'pointer'
        }}
      >
        {isLoading ? 'CALCULATING...' : 'RUN TENSORS'}
      </button>
    </div>
  );
}