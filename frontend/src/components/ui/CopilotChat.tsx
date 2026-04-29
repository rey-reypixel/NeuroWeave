import { useState, useRef, useEffect } from 'react';
import { useModelStore } from '../../store/useModelStore';
import { askCopilot } from '../../services/copilotService';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export function CopilotChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTopic, setCelebrationTopic] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const heads = useModelStore((state) => state.heads);
  const activeHeadIndex = useModelStore((state) => state.activeHeadIndex);
  const currentAttention = heads ? heads[activeHeadIndex] : null;

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Call the service with current tensor context
    const response = await askCopilot(input, currentAttention);
    
    const aiMsg: Message = { role: 'ai', text: response.message };
    setMessages(prev => [...prev, aiMsg]);
    
    // Check for high mastery score in the response
    if (response.message.includes('METADATA:')) {
      try {
        const metadataMatch = response.message.match(/METADATA:\s*\[([^\]]+)\],\s*\[(\d+)\],\s*\[(\d+)\]/);
        if (metadataMatch) {
          const topic = metadataMatch[1];
          const masteryScore = parseInt(metadataMatch[3]);
          
          if (masteryScore >= 8) {
            setCelebrationTopic(topic);
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
          }
        }
      } catch (e) {
        // Silently fail if metadata parsing fails
      }
    }
    
    setIsTyping(false);
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', height: '100%', 
      backgroundColor: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden'
    }}>
      {/* Chat Header */}
      <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#7aa2f7', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Socratic AI Copilot
        </h3>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.length === 0 && (
          <p style={{ color: '#565f89', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>
            Ask a question about the current tensor math...
          </p>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            backgroundColor: msg.role === 'user' ? '#7aa2f7' : 'rgba(255,255,255,0.05)',
            color: msg.role === 'user' ? '#1a1b26' : '#c0caf5',
            fontWeight: msg.role === 'user' ? '600' : '400',
            border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none'
          }}>
            {msg.text}
          </div>
        ))}

        {isTyping && (
          <div style={{ alignSelf: 'flex-start', color: '#565f89', fontSize: '0.8rem', fontStyle: 'italic' }}>
            AI is analyzing tensors...
          </div>
        )}

        {/* Growth Celebration Notification */}
        {showCelebration && (
          <div style={{
            alignSelf: 'center',
            backgroundColor: '#9ece6a',
            color: '#1a1b26',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            textAlign: 'center',
            animation: 'bounce 0.6s ease-in-out',
            boxShadow: '0 4px 20px rgba(158, 206, 106, 0.4)',
            border: '2px solid #9ece6a'
          }}>
            Level Up! You've mastered {celebrationTopic}!
          </div>
        )}
      </div>

      {/* Celebration Animation CSS */}
      <style>{`
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateY(0);
          }
          40%, 43% {
            transform: translateY(-10px);
          }
          70% {
            transform: translateY(-5px);
          }
          90% {
            transform: translateY(-2px);
          }
        }
      `}</style>

      {/* Input Area */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
        <input 
          type="text"
          placeholder="e.g. Why is the Softmax output a fraction?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ 
            flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '0.9rem', outline: 'none'
          }}
        />
        <button 
          onClick={handleSend}
          disabled={isTyping}
          style={{ 
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            backgroundColor: '#7aa2f7', color: '#1a1b26', fontWeight: 'bold', cursor: 'pointer',
            opacity: isTyping ? 0.5 : 1
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}