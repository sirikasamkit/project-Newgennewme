import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Sparkles, Loader2, PlayCircle, Apple, Flame, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export const PlanGenPage = ({ initialParams }) => {
  const { user } = useAuth();

  const [bmi, setBmi] = useState(initialParams?.bmi || '22.0');
  const [weight, setWeight] = useState(initialParams?.weight || user?.weight || '65');
  const [height, setHeight] = useState(initialParams?.height || user?.height || '170');
  const [status, setStatus] = useState(initialParams?.status || 'ปกติ / สมส่วน');
  const [activity, setActivity] = useState(user?.activity || 'general');
  const [mood, setMood] = useState('happy');
  const [sleep, setSleep] = useState('7');

  const [loading, setLoading] = useState(false);
  const [planResult, setPlanResult] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPlanResult('');
    try {
      const res = await api.generatePlan({
        bmi,
        weight,
        height,
        status,
        activity,
        mood,
        sleep
      });
      setPlanResult(res.plan);
      Swal.fire({
        icon: 'success',
        title: 'สร้างแผนสุขภาพสำเร็จ!',
        text: 'AI ออกแบบตารางอาหารและการออกกำลังกายเฉพาะบุคคลเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'สร้างแผนไม่สำเร็จ', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 1rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--accent-light)',
          color: 'var(--accent)',
          fontSize: '0.875rem',
          fontWeight: '600',
          marginBottom: '0.75rem'
        }}>
          <Sparkles size={16} /> AI Personalized Fitness & Meal Coach
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
          ออกแบบแผนโภชนาการและการออกกำลังกายเฉพาะคุณ
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          ระบบจะประมวลผลดัชนีมวลกาย ความพร้อมของร่างกาย และสไตล์ที่คุณต้องการ เพื่อสร้างแผนสุขภาพที่เหมาะสมที่สุด
        </p>
      </div>

      {/* Plan Form */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <form onSubmit={handleGenerate}>
          <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">ค่า BMI</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={bmi}
                onChange={(e) => setBmi(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">น้ำหนักปัจจุบัน (kg)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">ส่วนสูง (cm)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">เป้าหมาย / สไตล์การฝึก</label>
              <select
                className="form-select"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
              >
                <option value="general">🏃 ทั่วไปเพื่อสุขภาพ & กระชับสัดส่วน</option>
                <option value="bodybuilder">💪 เพาะกาย & สร้างกล้ามเนื้อ (Bodybuilder)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ระดับการพักผ่อน (ชั่วโมงนอน)</label>
              <select
                className="form-select"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
              >
                <option value="8">8+ ชั่วโมง (พักผ่อนเต็มที่)</option>
                <option value="7">7 ชั่วโมง (ปกติ)</option>
                <option value="6">6 ชั่วโมง (ปานกลาง)</option>
                <option value="5">น้อยกว่า 6 ชั่วโมง (นอนน้อย)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">อารมณ์ / สภาพร่างกายวันนี้</label>
              <select
                className="form-select"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              >
                <option value="happy">😄 สดชื่น พร้อมออกกำลังกาย</option>
                <option value="normal">🙂 ปกติ</option>
                <option value="tired">🥱 รู้สึกเหนื่อยล้า</option>
                <option value="stressed">😫 เครียด / ปวดเมื่อย</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            style={{ width: '100%', padding: '0.9rem' }}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={20} className="spin" /> Gemini AI กำลังออกแบบแผนสุขภาพเฉพาะตัวคุณ...</>
            ) : (
              <><Dumbbell size={18} /> สร้างแผนออกกำลังกายและมื้ออาหาร AI</>
            )}
          </button>
        </form>
      </div>

      {/* Plan Result Box */}
      {planResult && (
        <div className="glass-card animate-fade-in" style={{
          padding: '2rem',
          borderLeft: '5px solid var(--primary)',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sparkles size={24} color="var(--primary)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>แผนสุขภาพและตารางฝึกสำหรับคุณ</h2>
          </div>

          <div style={{
            whiteSpace: 'pre-line',
            lineHeight: '1.8',
            color: 'var(--text-primary)',
            fontSize: '1rem'
          }}>
            {planResult}
          </div>
        </div>
      )}
    </div>
  );
};
