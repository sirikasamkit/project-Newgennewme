import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Calculator, Droplets, Moon, Smile, Meh, Frown, 
  Flame, Sparkles, ArrowRight, Activity, Award, Heart, Check 
} from 'lucide-react';
import Swal from 'sweetalert2';

const DAILY_QUOTES = [
  "สุขภาพที่ดีไม่ได้เกิดขึ้นในชั่วข้ามคืน แต่เกิดจากสิ่งเล็กๆ ที่คุณทำทุกวัน",
  "ดื่มน้ำให้เพียงพอ ช่วยเพิ่มพลังสมองและระบบเผาผลาญได้ถึง 30%",
  "การออกกำลังกาย 20 นาที ดีกว่าการไม่ได้ออกเลย 100%",
  "พักผ่อนให้เพียงพอ คือการฟื้นฟูกล้ามเนื้อและสร้างภูมิคุ้มกันที่ดีที่สุด",
  "อาหารที่ดีคือยาที่ดีที่สุดสำหรับร่างกายของคุณ"
];

export const HomePage = ({ onNavigate, onOpenAuth }) => {
  const { user, isAuthenticated } = useAuth();

  // BMI Calculator States
  const [weight, setWeight] = useState(user?.weight || '');
  const [height, setHeight] = useState(user?.height || '');
  const [bmiResult, setBmiResult] = useState(null);

  // Daily Tracking States
  const [waterCups, setWaterCups] = useState(0);
  const [sleepHours, setSleepHours] = useState(7);
  const [mood, setMood] = useState('happy');
  const [savingTracking, setSavingTracking] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * DAILY_QUOTES.length));
    if (isAuthenticated) {
      loadTodayTracking();
    }
  }, [isAuthenticated]);

  const loadTodayTracking = async () => {
    try {
      const records = await api.getTracking();
      const todayStr = new Date().toISOString().split('T')[0];
      const todayData = records.find(r => r.date && r.date.startsWith(todayStr));
      if (todayData) {
        setWaterCups(todayData.water_intake || 0);
        setSleepHours(todayData.sleep_hours || 7);
        setMood(todayData.mood || 'happy');
      }
    } catch (err) {
      console.warn("Failed to load tracking:", err);
    }
  };

  const calculateBMI = (e) => {
    e?.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (!w || !h || w <= 0 || h <= 0) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ถูกต้อง', text: 'น้ำหนักและส่วนสูงต้องมากกว่า 0' });
      return;
    }

    const heightInMeters = h / 100;
    const bmi = +(w / (heightInMeters * heightInMeters)).toFixed(2);

    let status = '';
    let color = '';
    let advice = '';

    if (bmi < 18.5) {
      status = 'น้ำหนักน้อย / ผอม';
      color = '#3b82f6';
      advice = 'ควรเพิ่มอาหารที่มีโปรตีนและพลังงานเพื่อเสริมสร้างมวลกล้ามเนื้อ';
    } else if (bmi < 23) {
      status = 'น้ำหนักปกติ / สมส่วน';
      color = '#10b981';
      advice = 'ยอดเยี่ยมมาก! รักษาสมดุลโภชนาการและการออกกำลังกายสม่ำเสมอ';
    } else if (bmi < 25) {
      status = 'ท้วม / น้ำหนักเกิน';
      color = '#f59e0b';
      advice = 'ควรควบคุมปริมาณน้ำตาลและแป้ง พร้อมเพิ่มการคาร์ดิโอเบาๆ';
    } else if (bmi < 30) {
      status = 'อ้วนระดับ 1';
      color = '#f97316';
      advice = 'แนะนำให้วางแผนอาหารและออกกำลังกายอย่างจริงจังเพื่อลดความเสี่ยงสุขภาพ';
    } else {
      status = 'อ้วนระดับ 2 (อันตราย)';
      color = '#ef4444';
      advice = 'ควรปรึกษาแพทย์หรือผู้เชี่ยวชาญ และเริ่มปรับพฤติกรรมการกินอย่างถูกวิธี';
    }

    setBmiResult({ bmi, status, color, advice, weight: w, height: h });
  };

  const handleSaveTracking = async () => {
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }
    setSavingTracking(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await api.saveTracking({
        date: todayStr,
        water_intake: waterCups,
        sleep_hours: parseFloat(sleepHours),
        mood
      });
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: 'ข้อมูลสุขภาพประจำวันของคุณได้รับการบันทึกแล้ว',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: err.message });
    } finally {
      setSavingTracking(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Banner */}
      <section className="glass-card" style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(16, 185, 129, 0.08))',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 1rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          fontSize: '0.875rem',
          fontWeight: '600',
          marginBottom: '1rem'
        }}>
          <Sparkles size={16} /> นวัตกรรม AI ดูแลสุขภาพรุ่นใหม่
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: '800',
          lineHeight: '1.2',
          letterSpacing: '-1px',
          marginBottom: '1rem'
        }}>
          เปลี่ยนคุณเป็นคนใหม่ด้วย <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI Smart Wellness & Nutrition
          </span>
        </h1>

        <p style={{
          maxWidth: 650,
          margin: '0 auto 2rem',
          color: 'var(--text-secondary)',
          fontSize: '1.1rem'
        }}>
          วิเคราะห์อาหารผ่านภาพถ่าย คำนวณ BMI แนะนำแผนออกกำลังกายเฉพาะบุคคล และติดตามสุขภาพประจำวันได้อย่างง่ายดาย
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('food-scan')} className="btn btn-primary">
            สแกนอาหาร AI <ArrowRight size={18} />
          </button>
          <button onClick={() => onNavigate('plan-gen')} className="btn btn-accent">
            สร้างแผนสุขภาพเฉพาะคุณ
          </button>
        </div>
      </section>

      {/* Daily Motivation Box */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(245, 158, 11, 0.1)',
        borderLeft: '4px solid var(--warning)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>💡</span>
        <div>
          <div style={{ fontWeight: '700', color: 'var(--warning)', fontSize: '0.9rem' }}>เกร็ดสุขภาพประจำวัน</div>
          <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontStyle: 'italic' }}>
            "{DAILY_QUOTES[quoteIndex]}"
          </div>
        </div>
      </div>

      {/* Main Grid: BMI Calculator & Daily Health Tracker */}
      <div className="grid-2">
        {/* BMI Calculator Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calculator size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>คำนวณดัชนีมวลกาย (BMI)</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ประเมินรูปร่างและความสมดุลของร่างกาย</p>
            </div>
          </div>

          <form onSubmit={calculateBMI}>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">น้ำหนัก (กิโลกรัม)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="เช่น 65.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">ส่วนสูง (เซนติเมตร)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="เช่น 172"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              คำนวณค่า BMI
            </button>
          </form>

          {/* BMI Result Showcase */}
          {bmiResult && (
            <div className="animate-fade-in" style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: `2px solid ${bmiResult.color}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ค่า BMI ของคุณ</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: bmiResult.color, lineHeight: '1.2' }}>
                {bmiResult.bmi}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: `${bmiResult.color}20`,
                color: bmiResult.color,
                fontWeight: '700',
                fontSize: '0.9rem',
                margin: '0.5rem 0 0.75rem'
              }}>
                {bmiResult.status}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {bmiResult.advice}
              </p>

              <button
                onClick={() => onNavigate('plan-gen', { bmi: bmiResult.bmi, weight: bmiResult.weight, height: bmiResult.height, status: bmiResult.status })}
                className="btn btn-accent btn-sm"
                style={{ marginTop: '1rem', width: '100%' }}
              >
                สร้างแผนฟิตเนส AI จากผลลัพธ์นี้ <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Daily Tracking Card (Water, Sleep, Mood) */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>บันทึกสุขภาพประจำวัน</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ติดตามการดื่มน้ำ การนอน และอารมณ์</p>
            </div>
          </div>

          {/* Water Tracker */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
                <Droplets size={18} /> ปริมาณน้ำดื่ม (เป้าหมาย 8 แก้ว)
              </span>
              <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{waterCups} / 8 แก้ว</span>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((cup) => (
                <button
                  key={cup}
                  type="button"
                  onClick={() => setWaterCups(cup === waterCups ? cup - 1 : cup)}
                  style={{
                    flex: 1,
                    minWidth: 32,
                    height: 38,
                    borderRadius: '8px',
                    border: '1.5px solid var(--primary)',
                    background: cup <= waterCups ? 'var(--primary)' : 'transparent',
                    color: cup <= waterCups ? '#fff' : 'var(--primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    transition: 'var(--transition)'
                  }}
                >
                  {cup <= waterCups ? <Check size={16} /> : cup}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Hours Tracker */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)' }}>
                <Moon size={18} /> ชั่วโมงการนอนหลับ
              </span>
              <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{sleepHours} ชม.</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--secondary)', cursor: 'pointer' }}
            />
          </div>

          {/* Mood Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              อารมณ์ของคุณวันนี้
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                { id: 'happy', label: 'สดใส', icon: '😄' },
                { id: 'normal', label: 'ปกติ', icon: '🙂' },
                { id: 'tired', label: 'เหนื่อย', icon: '🥱' },
                { id: 'stressed', label: 'เครียด', icon: '😫' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${mood === m.id ? 'var(--accent)' : 'var(--border-color)'}`,
                    background: mood === m.id ? 'var(--accent-light)' : 'transparent',
                    color: mood === m.id ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: mood === m.id ? '700' : '500',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem',
                    transition: 'var(--transition)'
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{m.icon}</span>
                  <span style={{ fontSize: '0.75rem' }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveTracking}
            className="btn btn-accent"
            style={{ width: '100%' }}
            disabled={savingTracking}
          >
            {savingTracking ? 'กำลังบันทึก...' : 'บันทึกข้อมูลประจำวัน'}
          </button>
        </div>
      </div>
    </div>
  );
};
