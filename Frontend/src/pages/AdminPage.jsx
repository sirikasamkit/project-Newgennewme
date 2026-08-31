import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shield, Users, Camera, Dumbbell, Activity, Trash2, Bug, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export const AdminPage = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalScans: 0, totalPlans: 0, totalBMICalcs: 0 });
  const [users, setUsers] = useState([]);
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'bugs'

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, bugsData] = await Promise.all([
        api.getAdminStats().catch(() => ({ totalUsers: 0, totalScans: 0, totalPlans: 0, totalBMICalcs: 0 })),
        api.getAdminUsers().catch(() => []),
        api.getAdminBugReports().catch(() => [])
      ]);
      setStats(statsData);
      setUsers(usersData);
      setBugReports(bugsData);
    } catch (err) {
      console.error("Admin data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    const result = await Swal.fire({
      title: `ลบผู้ใช้ "${username}"?`,
      text: 'ข้อมูลทั้งหมดของผู้ใช้นี้ (BMI, อาหาร, แผนออกกำลังกาย) จะถูกลบถาวร',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบผู้ใช้',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await api.deleteAdminUser(userId);
        Swal.fire({ icon: 'success', title: 'ลบผู้ใช้เรียบร้อยแล้ว', timer: 1200, showConfirmButton: false });
        loadAdminData();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถลบได้', text: err.message });
      }
    }
  };

  const handleDeleteBug = async (bugId) => {
    try {
      await api.deleteAdminBugReport(bugId);
      setBugReports(prev => prev.filter(b => b.id !== bugId));
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ไม่สามารถลบได้', text: err.message });
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.8rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--warning)',
          fontSize: '0.85rem',
          fontWeight: '700',
          marginBottom: '0.5rem'
        }}>
          <Shield size={16} /> Admin Control Center
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>แผงควบคุมระบบและสถิติ (Admin Panel)</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid-4">
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>สมาชิกทั้งหมด</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{stats.totalUsers}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>การสแกนอาหาร</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{stats.totalScans}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>แผนที่สร้างโดย AI</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{stats.totalPlans}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>การคำนวณ BMI</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{stats.totalBMICalcs}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Users size={16} /> รายชื่อสมาชิก ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('bugs')}
            className={`btn btn-sm ${activeTab === 'bugs' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Bug size={16} /> รายงานปัญหา ({bugReports.length})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader2 size={30} className="spin" />
          </div>
        ) : activeTab === 'users' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem' }}>ID</th>
                  <th style={{ padding: '0.75rem' }}>ชื่อผู้ใช้</th>
                  <th style={{ padding: '0.75rem' }}>อีเมล</th>
                  <th style={{ padding: '0.75rem' }}>ระดับสิทธิ์</th>
                  <th style={{ padding: '0.75rem' }}>วันที่สมัคร</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem' }}>#{u.id}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>{u.username}</td>
                    <td style={{ padding: '0.75rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {u.is_admin === 1 ? (
                        <span className="badge badge-warning">Admin</span>
                      ) : (
                        <span className="badge badge-primary">User</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 size={14} /> ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {bugReports.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>ยังไม่มีรายงานปัญหา</p>
            ) : (
              bugReports.map(b => (
                <div key={b.id} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '0.25rem' }}>
                      จาก: {b.email || 'ไม่ระบุอีเมล'} • {new Date(b.created_at).toLocaleString('th-TH')}
                    </div>
                    <div style={{ fontSize: '0.95rem' }}>{b.message}</div>
                  </div>
                  <button onClick={() => handleDeleteBug(b.id)} className="btn btn-danger btn-icon btn-sm" title="ลบรายงาน">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
