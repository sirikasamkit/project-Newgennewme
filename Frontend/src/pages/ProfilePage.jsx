import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Camera, Save, Target, Award, Shield, Loader2, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export const ProfilePage = () => {
  const { user, profileImage, setProfileImage, refreshProfile } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [age, setAge] = useState(user?.age || '');
  const [gender, setGender] = useState(user?.gender || 'male');
  const [weight, setWeight] = useState(user?.weight || '');
  const [height, setHeight] = useState(user?.height || '');
  const [goalWeight, setGoalWeight] = useState(user?.goal_weight || '');
  const [activity, setActivity] = useState(user?.activity || 'general');

  const [previewImage, setPreviewImage] = useState(profileImage || null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setAge(user.age || '');
      setGender(user.gender || 'male');
      setWeight(user.weight || '');
      setHeight(user.height || '');
      setGoalWeight(user.goal_weight || '');
      setActivity(user.activity || 'general');
    }
  }, [user]);

  useEffect(() => {
    if (profileImage) {
      setPreviewImage(profileImage);
    }
  }, [profileImage]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'รูปภาพใหญ่เกินไป', text: 'กรุณาเลือกรูปขนาดไม่เกิน 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile({
        username,
        age: age ? parseInt(age) : null,
        gender,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        goal_weight: goalWeight ? parseFloat(goalWeight) : null,
        activity,
        profile_image: imageBase64 || undefined
      });

      if (imageBase64) {
        setProfileImage(imageBase64);
      }
      await refreshProfile();

      Swal.fire({
        icon: 'success',
        title: 'บันทึกข้อมูลสำเร็จ!',
        text: 'โปรไฟล์สุขภาพของคุณได้รับการอัปเดตแล้ว',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 850, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Profile Summary */}
      <div className="glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Avatar Upload */}
        <div style={{ position: 'relative', margin: '0 auto' }}>
          <div style={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid var(--primary)',
            boxShadow: 'var(--shadow-md)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {previewImage ? (
              <img src={previewImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={54} color="var(--text-muted)" />
            )}
          </div>

          <label style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Camera size={18} />
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={{ flex: 1, minWidth: 240, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{user?.username || 'ผู้ใช้งาน'}</h1>
            {user?.is_admin === 1 && (
              <span className="badge badge-warning"><Shield size={12} /> ผู้ดูแลระบบ (Admin)</span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{user?.email}</p>

          {/* Goal Weight Progress Chip */}
          {weight && goalWeight && (
            <div style={{
              marginTop: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              <Target size={16} /> น้ำหนักปัจจุบัน: {weight} kg ➜ เป้าหมาย: {goalWeight} kg ({Math.abs(weight - goalWeight).toFixed(1)} kg)
            </div>
          )}
        </div>
      </div>

      {/* Edit Form Card */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
          แก้ไขข้อมูลสุขภาพ & เป้าหมาย
        </h2>

        <form onSubmit={handleSave}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">ชื่อผู้ใช้งาน (Username)</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">อีเมล (ไม่สามารถแก้ไขได้)</label>
              <input
                type="email"
                className="form-input"
                value={email}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">อายุ (ปี)</label>
              <input
                type="number"
                className="form-input"
                placeholder="เช่น 25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">เพศ</label>
              <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">สไตล์การออกกำลังกาย</label>
              <select className="form-select" value={activity} onChange={(e) => setActivity(e.target.value)}>
                <option value="general">🏃 สุขภาพทั่วไป / กระชับสัดส่วน</option>
                <option value="bodybuilder">💪 เพาะกาย (Bodybuilder)</option>
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">น้ำหนักปัจจุบัน (kg)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="เช่น 65.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">ส่วนสูง (cm)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="เช่น 175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">น้ำหนักเป้าหมาย (kg)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="เช่น 60.0"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? <><Loader2 size={18} className="spin" /> กำลังบันทึกข้อมูล...</> : <><Save size={18} /> บันทึกการเปลี่ยนแปลง</>}
          </button>
        </form>
      </div>
    </div>
  );
};
