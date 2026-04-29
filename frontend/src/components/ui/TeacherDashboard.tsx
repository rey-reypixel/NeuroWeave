import { useEffect, useState } from 'react';
import axios from 'axios';

export function TeacherDashboard() {
  const [stats, setStats] = useState<any[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Function to pull real data from the backend
  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/teacher/stats');
      setStats(res.data);
      setLastFetchTime(new Date());
    } catch (e) {
      console.error("Failed to fetch teacher stats", e);
    }
  };

  const handleClear = async () => { 
    await axios.post('http://localhost:8000/api/v1/teacher/clear'); 
    setStats([]); 
  };

  useEffect(() => {
    fetchStats();
    // Live-polling every 5 seconds to update the bars as students ask questions
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate global confusion average
  const globalConfusion = stats.length > 0 
    ? Math.round((stats.reduce((acc, curr) => acc + (curr.confusion_score || 0), 0) / stats.length) * 10)
    : 0;

  const calculateTopicStats = (topicName: string) => {
    // Filters logs based on the topic identified by the AI
    const topicData = stats.filter(s => 
        s.topic.toLowerCase().includes(topicName.toLowerCase())
    );
    
    if (topicData.length === 0) return { difficulty: "N/A", percentage: 0 };
    
    // Averages the confusion scores (1-10)
    const avgScore = topicData.reduce((acc, curr) => acc + (curr.confusion_score || 0), 0) / topicData.length;
    
    return {
      difficulty: avgScore > 7 ? "High" : avgScore > 4 ? "Medium" : "Low",
      percentage: Math.min(Math.round(avgScore * 10), 100)
    };
  };

  const categories = [
    { name: "Softmax", key: "Softmax" },
    { name: "Positional Encoding", key: "Positional" },
    { name: "QKV Matrices", key: "QKV" }
  ];

  return (
    <>
      {/* Aggregate Header */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'rgba(255, 255, 255, 0.03)', 
        backdropFilter: 'blur(12px)', 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderRadius: '16px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ color: '#e2e8f0', margin: '0 0 5px 0', fontSize: '1.5rem' }}>Class Vibe Check</h2>
          <p style={{ color: '#a9b1d6', margin: 0, fontSize: '0.9rem' }}>
            Overall Confusion: {globalConfusion}% • {stats.length} interactions logged
          </p>
        </div>
        {globalConfusion > 70 && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 117, 127, 0.2)',
            border: '1px solid #ff757f',
            borderRadius: '20px',
            color: '#ff757f',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            ⚠️ High Class Friction
          </div>
        )}
      </div>
      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {categories.map((cat) => {
          const data = calculateTopicStats(cat.key);
          return (
            <div key={cat.name} style={{ 
              padding: '25px', 
              backgroundColor: 'rgba(255, 255, 255, 0.03)', 
              backdropFilter: 'blur(12px)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '16px',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ color: '#a9b1d6', margin: '0 0 10px 0', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {cat.name}
              </h3>
              <p style={{ color: '#e2e8f0', fontSize: '1.4rem', fontWeight: '800', margin: '10px 0' }}>
                Difficulty: <span style={{ 
                  color: data.difficulty === "High" ? "#ff757f" : data.difficulty === "Medium" ? "#ff9e64" : "#9ece6a" 
                }}>
                  {data.difficulty}
                </span>
              </p>
              
              {/* Progress Bar Container */}
              <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '5px', marginTop: '20px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${data.percentage}%`, 
                  height: '100%', 
                  backgroundColor: data.difficulty === "High" ? "#ff757f" : "#7aa2f7", 
                  borderRadius: '5px', 
                  transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' // Bouncy animation
                }}></div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#565f89', marginTop: '10px' }}>
                {data.percentage}% Class Confusion Index
              </p>
            </div>
          );
        })}
      </div>
      
      {/* Live Roadblock Stream */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: lastFetchTime ? '#9ece6a' : '#565f89',
              animation: lastFetchTime ? 'pulse 2s infinite' : 'none',
              boxShadow: lastFetchTime ? '0 0 10px rgba(158, 206, 106, 0.5)' : 'none'
            }}></div>
            <h3 style={{ color: '#737aa2', fontSize: '0.9rem', textTransform: 'uppercase', margin: 0 }}>Live Roadblock Stream</h3>
          </div>
          <button 
            onClick={handleClear}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#ff757f', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Clear All
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stats.slice().reverse().map((entry, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: `4px solid ${entry.confusion_score > 7 ? '#ff757f' : '#7aa2f7'}` }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#565f89', display: 'block' }}>{entry.topic}</span>
                <span style={{ color: '#c0caf5' }}>{entry.prompt}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: entry.confusion_score > 7 ? '#ff757f' : '#7aa2f7', fontWeight: 'bold' }}>{entry.confusion_score}/10</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Add CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}