import React from 'react';
import { Heart, Bug, Sparkles, ShieldCheck } from 'lucide-react';

export const Footer = ({ onOpenBugReport, onNavigate }) => {
  return (
    <footer style={{
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border-color)',
      padding: '2.5rem 1.5rem 1.5rem',
      marginTop: 'auto',
      transition: 'var(--transition)'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Brand Info */}
        <div>
          <div className="logo-title" style={{ marginBottom: '0.75rem' }}>
            <span className="logo-newgen">NeWGen</span>
            <span className="logo-newme">NewME</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            แพลตฟอร์มดูแลสุขภาพอัจฉริยะ ผสานพลัง Gemini AI เพื่อประเมินโภชนาการ แนะนำการออกกำลังกาย และติดตามสุขภาพเพื่อตัวคุณคนใหม่
          </p>
        </div>

        {/* Quick Features */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            ฟีเจอร์หลัก
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <li>
              <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                📊 คำนวณ BMI & บันทึกสุขภาพ
              </a>
            </li>
            <li>
              <a href="#food-scan" onClick={(e) => { e.preventDefault(); onNavigate('food-scan'); }} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                🍲 สแกนแคลอรี่อาหารด้วย AI
              </a>
            </li>
            <li>
              <a href="#plan-gen" onClick={(e) => { e.preventDefault(); onNavigate('plan-gen'); }} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                🏋️ แผนฟิตเนสและตารางฝึก
              </a>
            </li>
            <li>
              <a href="#chat" onClick={(e) => { e.preventDefault(); onNavigate('chat'); }} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                💬 ปรึกษาปัญหาสุขภาพกับ AI
              </a>
            </li>
          </ul>
        </div>

        {/* Support & Feedback */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            ช่วยเหลือและรายงานปัญหา
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            พบข้อผิดพลาด หรือมีข้อเสนอแนะในการพัฒนาแพลตฟอร์ม แจ้งให้ทีมงานทราบได้ทันที
          </p>
          <button
            onClick={onOpenBugReport}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', gap: '0.4rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
          >
            <Bug size={16} /> รายงานปัญหา / Bug Report
          </button>
        </div>
      </div>

      {/* Copyright */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <div>
          © {new Date().getFullYear()} NeWGen NewME. Powered by Google Gemini AI. All rights reserved.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>Crafted with</span> <Heart size={14} color="#ef4444" fill="#ef4444" /> <span>for Health & Wellness</span>
        </div>
      </div>
    </footer>
  );
};
