import { useEffect, useState } from 'react';
import axios from 'axios';

interface ProgressData {
  topic: string;
  mastery_score: number;
  confusion_score: number;
}

export function StudentProgress() {
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpTopic, setLevelUpTopic] = useState('');

  const fetchProgress = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/student/progress');
      setProgress(res.data);
    } catch (e) {
      console.error("Failed to fetch student progress", e);
    }
  };

  useEffect(() => {
    fetchProgress();
    const interval = setInterval(fetchProgress, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate average mastery per topic
  const calculateTopicMastery = (topicName: string) => {
    const topicData = progress.filter(p => 
      p.topic.toLowerCase().includes(topicName.toLowerCase())
    );
    
    if (topicData.length === 0) return 0;
    
    const avgMastery = topicData.reduce((acc, curr) => acc + (curr.mastery_score || 0), 0) / topicData.length;
    return Math.round(avgMastery);
  };

  const topics = [
    { name: "Softmax", key: "softmax" },
    { name: "Positional Encoding", key: "positional" },
    { name: "QKV Matrices", key: "qkv" }
  ];

  const masteryLevels = topics.map(topic => ({
    name: topic.name,
    level: calculateTopicMastery(topic.key)
  }));

  // Check for level up notifications
  useEffect(() => {
    const highMasteryTopics = masteryLevels.filter(t => t.level >= 8);
    if (highMasteryTopics.length > 0 && !showLevelUp) {
      setLevelUpTopic(highMasteryTopics[0].name);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  }, [masteryLevels]);

  const getHexagonColor = (level: number) => {
    if (level >= 8) return '#9ece6a'; // Green for high mastery
    if (level >= 5) return '#7aa2f7'; // Blue for medium mastery
    return '#ff757f'; // Red for low mastery
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '120px',
      height: '120px',
      backgroundColor: 'rgba(255, 255, 255, 0.03)', 
      backdropFilter: 'blur(12px)', 
      border: '1px solid rgba(255, 255, 255, 0.1)', 
      borderRadius: '12px',
      padding: '8px',
      zIndex: 1000
    }}>
      <h4 style={{ 
        color: '#a9b1d6', 
        margin: '0 0 6px 0', 
        fontSize: '0.7rem', 
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        textAlign: 'center'
      }}>
        Skill Progress
      </h4>
      
      {/* Hexagon Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {masteryLevels.map((topic, index) => (
          <div key={topic.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Hexagon */}
            <div style={{
              width: '18px',
              height: '18px',
              backgroundColor: getHexagonColor(topic.level),
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '7px',
              fontWeight: 'bold',
              color: 'white'
            }}>
              {topic.level}
            </div>
            {/* Label */}
            <div style={{ fontSize: '0.65rem', color: '#c0caf5' }}>
              {topic.name}
            </div>
            {/* Level */}
            <div style={{ 
              color: '#565f89', 
              fontSize: '0.6rem',
              marginLeft: 'auto'
            }}>
              {topic.level}/10
            </div>
          </div>
        ))}
      </div>

      {/* Level Up Notification */}
      {showLevelUp && (
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '0',
          backgroundColor: '#9ece6a',
          color: '#1a1a1a',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          animation: 'slideDown 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(158, 206, 106, 0.3)'
        }}>
          🎯 Level Up in {levelUpTopic}!
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
