import React from 'react';
import { Sparkles, ShieldCheck, Zap, HeartHandshake, Mail, MapPin, Globe } from 'lucide-react';

export const AboutContactPage = ({ onOpenBugReport }) => {
  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* About Section */}
      <div className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.8rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          fontSize: '0.85rem',
          fontWeight: '700',
          marginBottom: '0.75rem'
        }}>
          <Sparkles size={16} /> เกี่ยวกับเรา
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '1rem' }}>
          ยินดีต้อนรับสู่ <span className="logo-newgen">NeWGen</span> <span className="logo-newme">NewME</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.8', maxWidth: 700, margin: '0 auto' }}>
          NeWGen NewME คือแพลตฟอร์มผู้ช่วยดูแลสุขภาพยุคใหม่ที่ผสานเทคโนโลยีปัญญาประดิษฐ์ (Generative AI) 
          เข้ากับการดูแลสุขภาพและโภชนาการประจำวัน เพื่อให้ทุกคนเข้าถึงคำแนะนำด้านสุขภาพที่มีคุณภาพ รวดเร็ว และตรงกับไลฟ์สไตล์ของตนเองมากที่สุด
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid-3">
        <div className="glass-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Zap size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>AI ขับเคลื่อนอัจฉริยะ</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            ใช้โมเดล Gemini 2.5 Flash ในการวิเคราะห์ภาพอาหารและวางแผนออกกำลังกายแบบ Real-time
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>ความปลอดภัยสูงสุด</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            จัดเก็บรหัสผ่านแบบเข้ารหัส Bcrypt และรักษาความปลอดภัยด้วย JWT Authentication
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <HeartHandshake size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>ใช้งานง่าย ทุกอุปกรณ์</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            รองรับทั้งสมาร์ตโฟน แท็บเล็ต และคอมพิวเตอร์ ด้วย Responsive Single Page App
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1rem', textAlign: 'center' }}>
          ติดต่อและสนับสนุน
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
          <div>
            <Mail size={24} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: '700' }}>อีเมลสนับสนุน</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>support@newgennewme.com</div>
          </div>
          <div>
            <Globe size={24} color="var(--accent)" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: '700' }}>แพลตฟอร์ม</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>NeWGen NewME 2.0</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={onOpenBugReport} className="btn btn-secondary btn-sm">
            ต้องการแจ้งปัญหาหรือข้อเสนอแนะ? คลิกที่นี่
          </button>
        </div>
      </div>
    </div>
  );
};
