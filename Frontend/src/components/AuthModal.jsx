import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Mail, Lock, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export const AuthModal = ({ initialMode = 'login', onClose }) => {
  const { login } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot-1' | 'forgot-2'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      login(data.token, data.user, data.is_admin);
      Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ!',
        text: `ยินดีต้อนรับคุณ ${data.user}`,
        timer: 1500,
        showConfirmButton: false
      });
      onClose();
    } catch (err) {
      setError(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    setLoading(true);
    try {
      await api.register(username, email, password);
      Swal.fire({
        icon: 'success',
        title: 'สมัครสมาชิกสำเร็จ!',
        text: 'กรุณาเข้าสู่ระบบด้วยบัญชีของคุณ',
        confirmButtonColor: '#0ea5e9'
      });
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.checkEmail(email);
      setMode('forgot-2');
    } catch (err) {
      setError(err.message || 'ไม่พบอีเมลนี้ในระบบ');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(email, newPassword);
      Swal.fire({
        icon: 'success',
        title: 'ตั้งรหัสผ่านใหม่สำเร็จ!',
        text: 'คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที',
        confirmButtonColor: '#10b981'
      });
      setMode('login');
      setPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
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

        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {mode === 'login' && 'เข้าสู่ระบบ'}
            {mode === 'register' && 'สมัครสมาชิกใหม่'}
            {mode.startsWith('forgot') && 'รีเซ็ตรหัสผ่าน'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {mode === 'login' && 'เข้าถึงประวัติและแผนสุขภาพ AI เฉพาะตัวคุณ'}
            {mode === 'register' && 'เริ่มต้นดูแลสุขภาพกับ NeWGen NewME'}
            {mode === 'forgot-1' && 'กรอกอีเมลบัญชีของคุณเพื่อตรวจสอบ'}
            {mode === 'forgot-2' && 'กำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">อีเมล (Email)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="flex-between">
                <label className="form-label">รหัสผ่าน (Password)</label>
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); setMode('forgot-1'); setError(''); }}
                  style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}
                >
                  ลืมรหัสผ่าน?
                </a>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <><Loader2 size={18} className="spin" /> กำลังเข้าสู่ระบบ...</> : 'เข้าสู่ระบบ'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ยังไม่มีบัญชีใช่หรือไม่?{' '}
              <a
                href="#register"
                onClick={(e) => { e.preventDefault(); setMode('register'); setError(''); }}
                style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}
              >
                สมัครสมาชิก
              </a>
            </div>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">ชื่อผู้ใช้งาน (Username)</label>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น Boat, Alex"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">อีเมล (Email)</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <><Loader2 size={18} className="spin" /> กำลังลงทะเบียน...</> : 'สร้างบัญชีผู้ใช้'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              มีบัญชีอยู่แล้ว?{' '}
              <a
                href="#login"
                onClick={(e) => { e.preventDefault(); setMode('login'); setError(''); }}
                style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}
              >
                เข้าสู่ระบบ
              </a>
            </div>
          </form>
        )}

        {/* Forgot Password Step 1 */}
        {mode === 'forgot-1' && (
          <form onSubmit={handleCheckEmail}>
            <div className="form-group">
              <label className="form-label">อีเมลที่ใช้สมัคร</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <><Loader2 size={18} className="spin" /> กำลังตรวจสอบ...</> : 'ถัดไป'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="btn btn-secondary btn-sm"
              >
                ย้อนกลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Step 2 */}
        {mode === 'forgot-2' && (
          <form onSubmit={handleResetPassword}>
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.85rem'
            }}>
              รีเซ็ตรหัสผ่านสำหรับ: <b>{email}</b>
            </div>

            <div className="form-group">
              <label className="form-label">รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)</label>
              <input
                type="password"
                className="form-input"
                placeholder="รหัสผ่านใหม่"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <><Loader2 size={18} className="spin" /> กำลังบันทึก...</> : 'ยืนยันรหัสผ่านใหม่'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
