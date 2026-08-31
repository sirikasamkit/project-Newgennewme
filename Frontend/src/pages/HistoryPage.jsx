import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { History, Trash2, Calendar, Utensils, Dumbbell, Activity, Loader2, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export const HistoryPage = () => {
  const [history, setHistory] = useState({ bmi: [], foods: [], plans: [] });
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' | 'bmi' | 'foods' | 'plans'

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory(1);
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบรายการ?',
      text: 'รายการนี้จะถูกลบออกจากประวัติของคุณอย่างถาวร',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        if (type === 'bmi') await api.deleteBmiHistory(id);
        if (type === 'food') await api.deleteFoodHistory(id);
        if (type === 'plan') await api.deletePlanHistory(id);

        Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', timer: 1200, showConfirmButton: false });
        loadHistory();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: err.message });
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={28} color="var(--primary)" /> ประวัติสุขภาพของคุณ
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            รายการคำนวณ BMI การสแกนอาหาร และแผนออกกำลังกายที่บันทึกไว้
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-card)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveSubTab('all')}
            className={`btn btn-sm ${activeSubTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setActiveSubTab('bmi')}
            className={`btn btn-sm ${activeSubTab === 'bmi' ? 'btn-primary' : 'btn-secondary'}`}
          >
            BMI
          </button>
          <button
            onClick={() => setActiveSubTab('foods')}
            className={`btn btn-sm ${activeSubTab === 'foods' ? 'btn-primary' : 'btn-secondary'}`}
          >
            อาหาร
          </button>
          <button
            onClick={() => setActiveSubTab('plans')}
            className={`btn btn-sm ${activeSubTab === 'plans' ? 'btn-primary' : 'btn-secondary'}`}
          >
            แผนฟิตเนส
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="spin" color="var(--primary)" />
          <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>กำลังโหลดประวัติ...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* BMI History Section */}
          {(activeSubTab === 'all' || activeSubTab === 'bmi') && history.bmi?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Activity size={18} /> ประวัติการคำนวณ BMI
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.bmi.map((item) => (
                  <div key={item.id} className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
                          BMI: {item.bmi}
                        </span>
                        <span className="badge badge-accent">{item.status}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        น้ำหนัก: {item.weight} kg | ส่วนสูง: {item.height} cm • วันที่: {new Date(item.created_at).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete('bmi', item.id)}
                      className="btn btn-danger btn-icon btn-sm"
                      title="ลบรายการนี้"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Food History Section */}
          {(activeSubTab === 'all' || activeSubTab === 'foods') && history.foods?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '1rem 0 0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Utensils size={18} /> ประวัติการสแกนอาหาร
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.foods.map((item) => (
                  <div key={item.id} className="glass-card" style={{ padding: '1.25rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '1rem' }}>{item.food_name || 'อาหาร'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(item.created_at).toLocaleDateString('th-TH')}
                        </span>
                        <button
                          onClick={() => handleDelete('food', item.id)}
                          className="btn btn-danger btn-icon btn-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                      {item.analysis}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plans History Section */}
          {(activeSubTab === 'all' || activeSubTab === 'plans') && history.plans?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '1rem 0 0.75rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Dumbbell size={18} /> ประวัติแผนออกกำลังกาย AI
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.plans.map((item) => (
                  <div key={item.id} className="glass-card" style={{ padding: '1.25rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--secondary)' }}>
                        แผนสุขภาพเฉพาะบุคคล
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(item.created_at).toLocaleDateString('th-TH')}
                        </span>
                        <button
                          onClick={() => handleDelete('plan', item.id)}
                          className="btn btn-danger btn-icon btn-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                      {item.plan_details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!history.bmi?.length && !history.foods?.length && !history.plans?.length) && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>ยังไม่มีประวัติในระบบ</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                ลองเริ่มคำนวณ BMI สแกนอาหาร หรือสร้างแผนออกกำลังกายเพื่อเริ่มบันทึกข้อมูลสุขภาพของคุณ
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
