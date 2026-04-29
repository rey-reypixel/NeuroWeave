// frontend/src/components/ui/HeadSelector.tsx
import { useModelStore } from '../../store/useModelStore';

export function HeadSelector() {
  const heads = useModelStore((state) => state.heads);
  const activeHeadIndex = useModelStore((state) => state.activeHeadIndex);
  const setActiveHead = useModelStore((state) => state.setActiveHead);

  if (!heads) return null;

  return (
    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
      <label style={{ color: '#8892b0', fontWeight: 'bold' }}>Active Attention Head:</label>
      <select 
        value={activeHeadIndex} 
        onChange={(e) => setActiveHead(Number(e.target.value))}
        style={{ 
          padding: '8px 12px', borderRadius: '4px', border: '1px solid #444',
          backgroundColor: '#1e1e1e', color: '#00c853', fontWeight: 'bold', fontSize: '1rem', outline: 'none', cursor: 'pointer'
        }}
      >
        {heads.map((_, index) => (
          <option key={index} value={index}>
            Head {index} (Context Contextualizer)
          </option>
        ))}
      </select>
    </div>
  );
}