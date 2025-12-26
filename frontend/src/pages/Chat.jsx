import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../api';
import './Chat.css';

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');

  const token = useMemo(() => localStorage.getItem('token'), []);
  const myIdFromToken = useMemo(() => {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const id = Number(payload?.user_id);
      return Number.isFinite(id) ? id : null;
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    fetchMessages(selectedUserId);

    const t = setInterval(() => {
      fetchMessages(selectedUserId, { silent: true });
    }, 5000);

    return () => clearInterval(t);
  }, [selectedUserId]);

  const fetchConversations = async () => {
    setLoadingConvos(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        setError('Failed to load conversations');
        return;
      }

      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);

      if (!selectedUserId && Array.isArray(data) && data.length > 0) {
        setSelectedUserId(data[0].other_user_id);
      }
    } catch (e) {
      setError('Failed to load conversations');
    } finally {
      setLoadingConvos(false);
    }
  };

  const fetchMessages = async (otherUserId, options = {}) => {
    if (!options.silent) {
      setLoadingMessages(true);
    }
    setError('');

    try {
      const res = await fetch(`${API_BASE}/chat/messages/${otherUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        setError('Failed to load messages');
        return;
      }

      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load messages');
    } finally {
      if (!options.silent) {
        setLoadingMessages(false);
      }
    }
  };

  const selectedConversation = conversations.find((c) => c.other_user_id === selectedUserId);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const content = draft.trim();
    if (!content) return;

    setDraft('');

    try {
      const res = await fetch(`${API_BASE}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipient_id: selectedUserId, content })
      });

      if (!res.ok) {
        setError('Failed to send message');
        return;
      }

      await fetchMessages(selectedUserId, { silent: true });
      await fetchConversations();
    } catch (e2) {
      setError('Failed to send message');
    }
  };

  return (
    <div className="chat-page">
      <h1>Chat</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="chat-layout">
        <div className="chat-sidebar">
          <h2>Conversations</h2>
          {loadingConvos ? (
            <div className="loading">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="empty">No conversations yet.</div>
          ) : (
            <div className="conversation-list">
              {conversations.map((c) => (
                <button
                  key={c.other_user_id}
                  className={`conversation-item ${selectedUserId === c.other_user_id ? 'active' : ''}`}
                  onClick={() => setSelectedUserId(c.other_user_id)}
                >
                  <div className="conversation-name">{c.other_user_name}</div>
                  {c.last_message && (
                    <div className="conversation-last">{c.last_message}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="chat-main">
          <div className="chat-header">
            <h2>{selectedConversation ? selectedConversation.other_user_name : 'Select a conversation'}</h2>
          </div>

          <div className="chat-messages">
            {loadingMessages ? (
              <div className="loading">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="empty">No messages yet.</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`chat-message ${m.sender_id === myIdFromToken ? 'me' : 'them'}`}>
                  <div className="chat-bubble">{m.content}</div>
                </div>
              ))
            )}
          </div>

          <form className="chat-compose" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder={selectedUserId ? 'Type a message…' : 'Select a conversation to start'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!selectedUserId}
            />
            <button type="submit" className="btn-primary" disabled={!selectedUserId || !draft.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
