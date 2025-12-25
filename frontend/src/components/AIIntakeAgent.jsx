// frontend/src/components/AIIntakeAgent.jsx
import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../api';
import './AIIntakeAgent.css';

export default function AIIntakeAgent({ onComplete }) {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [extractedData, setExtractedData] = useState({});
  const [conversationHistory, setConversationHistory] = useState([]);
  const [progress, setProgress] = useState(0);
  const messagesEndRef = useRef(null);

  const TOTAL_QUESTIONS = 12;

  useEffect(() => {
    startConversation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setProgress((conversationHistory.length / TOTAL_QUESTIONS) * 100);
  }, [conversationHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/ai-agent/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '',
          conversation_history: []
        })
      });

      if (res.ok) {
        const data = await res.json();
        addMessage('ai', data.message, data.question_type);
      } else {
        addMessage('ai', 'Sorry, I encountered an error starting the conversation. Please refresh and try again.');
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
      addMessage('ai', 'Connection error. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (role, content, type = null) => {
    const newMessage = {
      role,
      content,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const parseUserResponse = (questionType, userInput) => {
    const data = { ...extractedData };
    
    switch (questionType) {
      case 'welcome':
        data.career_stage = userInput;
        break;
      case 'primary_goal':
        data.primary_goal = userInput;
        break;
      case 'specific_goal':
        data.specific_goal = userInput;
        break;
      case 'current_challenges':
        data.current_challenges = userInput;
        break;
      case 'desired_skills':
        data.desired_skills = userInput;
        break;
      case 'current_skills':
        data.current_skills = userInput;
        break;
      case 'industry':
        data.industry_interest = userInput;
        break;
      case 'time_commitment':
        data.time_commitment = userInput;
        break;
      case 'budget':
        data.budget_range = userInput;
        break;
      case 'timeline':
        data.timeline = userInput;
        break;
      case 'mentor_style':
        data.preferred_mentor_style = userInput;
        break;
      case 'communication':
        data.communication_preference = userInput;
        break;
    }
    
    setExtractedData(data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const currentQuestionType = messages[messages.length - 1]?.type;
    const trimmedInput = userInput.trim();
    
    addMessage('user', trimmedInput);
    
    if (currentQuestionType) {
      parseUserResponse(currentQuestionType, trimmedInput);
    }
    
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: trimmedInput }
    ];
    setConversationHistory(updatedHistory);
    
    setUserInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_BASE}/ai-agent/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: trimmedInput,
          conversation_history: updatedHistory
        })
      });

      if (res.ok) {
        const data = await res.json();
        addMessage('ai', data.message, data.question_type);

        if (data.is_complete) {
          setIsComplete(true);
          await saveIntakeAndGetMatches();
        }
      } else {
        const error = await res.json();
        addMessage('ai', `Error: ${error.detail || 'Something went wrong. Please try again.'}`);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      addMessage('ai', 'Connection error. Your message wasn\'t sent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveIntakeAndGetMatches = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const intakeRes = await fetch(`${API_BASE}/ai-agent/intake`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...extractedData,
          conversation_summary: `Mentee seeking ${extractedData.primary_goal || 'guidance'}`,
          conversation_log: conversationHistory
        })
      });

      if (!intakeRes.ok) {
        addMessage('ai', 'Had trouble saving your responses. Let me still find matches for you...');
      }

      addMessage('ai', '🔍 Analyzing mentor database...');
      
      const matchRes = await fetch(`${API_BASE}/ai-agent/matches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (matchRes.ok) {
        const matches = await matchRes.json();
        
        if (matches.length === 0) {
          addMessage('ai', '😕 No perfect matches found yet, but you can browse all available mentors. We\'re adding new mentors regularly!');
          setTimeout(() => onComplete([]), 2000);
        } else {
          addMessage('ai', `🎉 Found ${matches.length} amazing mentor${matches.length > 1 ? 's' : ''} for you! Let me show you...`);
          setTimeout(() => onComplete(matches), 2000);
        }
      } else {
        addMessage('ai', 'Had trouble finding matches. Please try browsing mentors manually.');
        setTimeout(() => onComplete([]), 3000);
      }
    } catch (err) {
      console.error('Failed to complete intake:', err);
      addMessage('ai', 'Something went wrong. Please try the mentor search manually.');
      setTimeout(() => onComplete([]), 3000);
    }
  };

  const handleQuickReply = (reply) => {
    setUserInput(reply);
  };

  const getQuickReplies = () => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'ai' || isLoading) return [];

    switch (lastMessage.type) {
      case 'welcome':
        return ['Student', 'Early career (0-3 years)', 'Mid-level (4-8 years)', 'Career change'];
      case 'primary_goal':
        return ['Learn specific skills', 'Career transition', 'Leadership development', 'Start a business'];
      case 'time_commitment':
        return ['1 hour/week', '2-3 hours/week', 'Flexible'];
      case 'budget':
        return ['Free', '$0-50/hr', '$50-100/hr', '$100+/hr'];
      case 'timeline':
        return ['3 months', '6 months', '12 months'];
      case 'communication':
        return ['Video calls', 'Text/Chat', 'Both'];
      default:
        return [];
    }
  };

  return (
    <div className="ai-intake-container">
      <div className="ai-header">
        <div className="ai-avatar">🤖</div>
        <div className="ai-header-text">
          <h2>AI Mentorship Assistant</h2>
          <p className="ai-subtitle">Finding your perfect mentor match</p>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        <div className="progress-text">
          {conversationHistory.length} / {TOTAL_QUESTIONS} questions
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.role === 'ai' && (
              <div className="message-avatar">🤖</div>
            )}
            <div className="message-content">
              <div className="message-bubble">
                {msg.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className="message-time">
                {msg.timestamp?.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message ai">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="message-bubble typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {!isComplete && getQuickReplies().length > 0 && (
        <div className="quick-replies">
          {getQuickReplies().map((reply, idx) => (
            <button
              key={idx}
              className="quick-reply-btn"
              onClick={() => handleQuickReply(reply)}
              disabled={isLoading}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={sendMessage} className="chat-input-form">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={isComplete ? "Processing your matches..." : "Type your answer..."}
          disabled={isLoading || isComplete}
          className="chat-input"
          autoFocus
        />
        <button 
          type="submit" 
          disabled={isLoading || isComplete || !userInput.trim()}
          className="chat-send-btn"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}