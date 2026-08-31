import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { MessageSquare, Send, Sparkles, User, Loader2, Bot } from 'lucide-react';

const SUGGESTIONS = [
  "อยากเริ่มลดน้ำหนัก 5 กก. ควรปรับการกินอย่างไร?",
  "อาหารโปรตีนสูงที่หาซื้อง่ายใน 7-Eleven มีอะไรบ้าง?",
  "วิธีแก้อาการปวดคอบ่าไหล่จาก Office Syndrome",
  "ควรดื่มน้ำวันละกี่ลิตร และแบ่งเวลาดื่มอย่างไร?"
];

export const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'สวัสดีครับ! ผมคือ NeWGen AI ผู้ช่วยอัจฉริยะด้านสุขภาพ โภชนาการ และการออกกำลังกาย มีอะไรให้ผมช่วยแนะนำวันนี้ไหมครับ?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chat(query);
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: res.reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'ขออภัยครับ ขณะนี้ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 850, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: 500 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700' }}>NeWGen Wellness Chat Assistant</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '600' }}>● AI พร้อมให้คำปรึกษาตลอด 24 ชั่วโมง</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="glass-card" style={{
        flex: 1,
        padding: '1.5rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            {m.sender === 'ai' && (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={18} />
              </div>
            )}

            <div style={{
              padding: '0.85rem 1.15rem',
              borderRadius: '16px',
              borderBottomLeftRadius: m.sender === 'ai' ? '4px' : '16px',
              borderBottomRightRadius: m.sender === 'user' ? '4px' : '16px',
              background: m.sender === 'user'
                ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))'
                : 'var(--bg-surface)',
              color: m.sender === 'user' ? 'white' : 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)',
              border: m.sender === 'ai' ? '1px solid var(--border-color)' : 'none',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-line'
            }}>
              {m.text}
            </div>

            {m.sender === 'user' && (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={18} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Loader2 size={18} className="spin" />
            </div>
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '16px',
              background: 'var(--bg-surface)',
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}>
              NeWGen AI กำลังพิมพ์คำตอบ...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="btn btn-secondary btn-sm"
            style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{ display: 'flex', gap: '0.5rem' }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="พิมพ์คำถามเกี่ยวกับสุขภาพ อาหาร หรือการออกกำลังกาย..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '0 1.25rem', flexShrink: 0 }}
          disabled={loading || !input.trim()}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
