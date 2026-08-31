import React, { useState } from 'react';
import { api } from '../services/api';
import { Camera, Upload, Sparkles, Loader2, Utensils, CheckCircle, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export const FoodScanPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'ไฟล์มีขนาดใหญ่เกินไป', text: 'กรุณาเลือกรูปภาพขนาดไม่เกิน 5 MB' });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult('');
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      Swal.fire({ icon: 'warning', title: 'ยังไม่ได้เลือกรูปภาพ', text: 'กรุณาอัปโหลดหรือถ่ายภาพอาหารก่อนเริ่มวิเคราะห์' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await api.analyzeFood(formData);
      setAnalysisResult(res.analysis);
      Swal.fire({
        icon: 'success',
        title: 'วิเคราะห์สำเร็จ!',
        text: 'AI ประมวลผลสารอาหารและแคลอรี่เรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'การวิเคราะห์ล้มเหลว',
        text: err.message || 'ไม่สามารถวิเคราะห์ภาพได้ กรุณาลองใหม่อีกครั้ง'
      });
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
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          fontSize: '0.875rem',
          fontWeight: '600',
          marginBottom: '0.75rem'
        }}>
          <Sparkles size={16} /> AI Food Nutrition Vision
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
          สแกนอาหารและคำนวณแคลอรี่ด้วย AI
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          เพียงอัปโหลดหรือถ่ายภาพอาหาร Gemini AI จะประเมินชื่อเมนู พลังงาน (kcal) และสารอาหารหลักให้ทันที
        </p>
      </div>

      {/* Upload & Analysis Box */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <form onSubmit={handleAnalyze}>
          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            cursor: 'pointer',
            position: 'relative',
            transition: 'var(--transition)'
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                cursor: 'pointer',
                width: '100%',
                height: '100%'
              }}
            />

            {previewUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <img
                  src={previewUrl}
                  alt="Food Preview"
                  style={{
                    maxHeight: 280,
                    maxWidth: '100%',
                    borderRadius: 'var(--radius-md)',
                    objectFit: 'cover',
                    boxShadow: 'var(--shadow-md)'
                  }}
                />
                <span className="badge badge-primary">คลิกเพื่อเปลี่ยนรูปภาพ</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Upload size={28} />
                </div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>ลากรูปภาพมาวางที่นี่ หรือคลิกเพื่ออัปโหลด</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>รองรับไฟล์ JPG, PNG, WEBP (สูงสุด 5MB)</div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem', padding: '0.9rem' }}
            disabled={loading || !selectedFile}
          >
            {loading ? (
              <><Loader2 size={20} className="spin" /> Gemini AI กำลังวิเคราะห์สารอาหารในภาพ...</>
            ) : (
              <><Sparkles size={18} /> เริ่มวิเคราะห์ภาพอาหาร</>
            )}
          </button>
        </form>
      </div>

      {/* Analysis Result Box */}
      {analysisResult && (
        <div className="glass-card animate-fade-in" style={{
          padding: '2rem',
          borderLeft: '5px solid var(--accent)',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Utensils size={22} color="var(--accent)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>ผลการวิเคราะห์โภชนาการ</h2>
          </div>

          <div style={{
            whiteSpace: 'pre-line',
            lineHeight: '1.8',
            color: 'var(--text-primary)',
            fontSize: '1rem'
          }}>
            {analysisResult}
          </div>
        </div>
      )}
    </div>
  );
};
