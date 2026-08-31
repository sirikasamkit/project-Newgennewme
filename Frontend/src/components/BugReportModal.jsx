import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Bug, Send, Loader2, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export const BugReportModal = ({ onClose }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      Swal.fire({ icon: 'warning', title: 'ข้อความสั้นเกินไป', text: 'กรุณากรอกรายละเอียดปัญหาอย่างน้อย 5 ตัวอักษร' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitBugReport(email, message);
      Swal.fire({
        icon: 'success',
        title: 'ส่งรายงานเรียบร้อยแล้ว!',
        text: res.message || 'ขอบคุณสำหรับการแจ้งข้อมูล ทีมงานจะเร่งปรับปรุงระบบครับ',
        confirmButtonColor: '#0ea5e9'
      });
      onClose();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ส่งรายงานไม่สำเร็จ', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            color: 'var(--danger)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <Bug size={26} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            รายงานปัญหา / ข้อเสนอแนะ
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ช่วยให้เราพัฒนา NeWGen NewME ให้ดียิ่งขึ้น แจ้งปัญหาหรือฟีเจอร์ที่คุณอยากได้
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">อีเมลสำหรับติดต่อกลับ (ถ้ามี)</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">รายละเอียดปัญหาหรือข้อเสนอแนะ *</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="อธิบายสิ่งที่คุณพบ เช่น กดปุ่มแล้วไม่ทำงาน, การแสดงผลผิดพลาด..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? <><Loader2 size={18} className="spin" /> กำลังส่งข้อมูล...</> : <><Send size={16} /> ส่งรายงาน</>}
          </button>
        </form>
      </div>
    </div>
  );
};
