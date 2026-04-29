// frontend/src/components/ui/MatrixVisualizer.tsx
import { Matrix } from '../../types/transformer';

interface Props {
  title: string;
  data: Matrix;
  isHeatmap?: boolean;
  rowLabels?: string[]; // NEW: Words on the left
  colLabels?: string[]; // NEW: Words on the top
}

export function MatrixVisualizer({ title, data, isHeatmap = false, rowLabels, colLabels }: Props) {
 // frontend/src/components/ui/MatrixVisualizer.tsx
  return (
    <div style={{ 
      margin: '10px', 
      padding: '15px', 
      
      // GLASSMORPHISM EFFECT
      backgroundColor: 'rgba(255, 255, 255, 0.03)', 
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.08)', 
      borderRadius: '12px',
      
      width: 'fit-content',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#a9b1d6', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {title}
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Column Labels */}
        {colLabels && (
          <div style={{ display: 'flex', marginLeft: rowLabels ? '60px' : '0', marginBottom: '8px', gap: '4px' }}>
            {colLabels.map((label, i) => (
              <div key={`col-${i}`} style={{ 
                width: '50px', textAlign: 'center', color: '#7aa2f7', // Neo-blue accent
                fontSize: '0.75rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' 
              }}>
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Matrix Body */}
        {data.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} style={{ display: 'flex', gap: '4px', marginBottom: '4px', alignItems: 'center' }}>
            
            {/* Row Label */}
            {rowLabels && (
              <div style={{ 
                width: '55px', textAlign: 'right', paddingRight: '5px', 
                color: '#7aa2f7', fontSize: '0.75rem', fontWeight: 'bold',
                overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {rowLabels[rowIndex]}
              </div>
            )}

            {/* Cells */}
            {row.map((val, colIndex) => {
              const baseBg = 'rgba(0, 0, 0, 0.3)';
              // Sleeker, highly saturated neon green for the heatmap
              const heatBg = `rgba(10, 255, 150, ${Math.max(val, 0.05)})`; 
              const textColor = isHeatmap && val > 0.5 ? '#000000' : '#c0caf5';
              
              return (
                <div 
                  key={`cell-${rowIndex}-${colIndex}`} 
                  // APPLY THE Monospace class
                  className="matrix-data"
                  style={{
                    width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isHeatmap ? heatBg : baseBg, 
                    borderRadius: '6px', // Slightly rounder cells
                    fontSize: '0.85rem', color: textColor,
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255, 255, 255, 0.05)' // Subtle cell borders
                  }}
                  title={`Value: ${val}`}
                >
                  {val.toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}