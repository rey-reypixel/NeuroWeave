// frontend/src/components/ui/StudentProgress.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export function StudentProgress() {
  const [stats, setStats] = useState<any[]>([]);

  const fetchProgress = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/teacher/stats'); // We can use the same endpoint for now
      setStats(res.data);
    } catch (e) {
      console.error("Failed to fetch progress", e);
    }
  };

  useEffect(() => {
    fetchProgress();
    const interval = setInterval(fetchProgress, 5000); // Live sync
    return () => clearInterval(interval);
  }, []);

  const calculateMastery = (topicName: string) => {
    const topicData = stats.filter(s => s.topic.toLowerCase().includes(topicName.toLowerCase()));
    if (topicData.length === 0) return 0;
    
    // Get the *highest* mastery score the student has achieved in this topic
    const maxMastery = Math.max(...topicData.map(s => s.mastery_score || 0));
    return Math.min(Math.round(maxMastery * 10), 100);
  };

  const categories = [
    { name: "Softmax", key: "Softmax" },
    { name: "Positional", key: "Positional" },
    { name: "QKV", key: "QKV" }
  ];

  return (
    <div style={{ 
      padding: '15px', 
      backgroundColor: 'rgba(0, 0, 0, 0.2)', 
      border: '1px solid rgba(122, 162, 247, 0.2)', 
      borderRadius: '12px',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#7aa2f7', fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 15px 0', letterSpacing: '1px' }}>
        🧠 Neural Mastery (Skill Tree)
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {categories.map((cat) => {
          const mastery = calculateMastery(cat.key);
          return (
            <div key={cat.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a9b1d6', marginBottom: '4px' }}>
                <span>{cat.name}</span>
                <span style={{ color: mastery > 70 ? '#7dcfff' : '#565f89' }}>Lv. {Math.floor(mastery / 10)}</span>
              </div>
              {/* The "XP" Bar */}
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${mastery}%`, 
                  height: '100%', 
                  backgroundColor: '#7dcfff', // Cyan color for mastery
                  boxShadow: mastery > 70 ? '0 0 10px rgba(125, 207, 255, 0.5)' : 'none',
                  borderRadius: '3px', 
                  transition: 'width 1s ease-out' 
                }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}