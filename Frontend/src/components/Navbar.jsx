import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, Moon, User, LogIn, LogOut, Shield, History, 
  Sparkles, Camera, Dumbbell, MessageSquare, Menu, X, HelpCircle 
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, openAuthModal }) => {
  const { user, profileImage, isAuthenticated, isAdmin, logout, theme, toggleTheme } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.85rem 1.5rem',
      transition: 'var(--transition)'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('home')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)'
          }}>
            <Sparkles size={22} />
          </div>
          <div className="logo-title">
            <span className="logo-newgen">NeWGen</span>
            <span className="logo-newme">NewME</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="desktop-nav">
          <button
            onClick={() => handleNavClick('home')}
            className={`btn btn-sm ${activeTab === 'home' ? 'btn-primary' : 'btn-secondary'}`}
          >
            หน้าหลัก
          </button>
          <button
            onClick={() => handleNavClick('food-scan')}
            className={`btn btn-sm ${activeTab === 'food-scan' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Camera size={16} /> สแกนอาหาร AI
          </button>
          <button
            onClick={() => handleNavClick('plan-gen')}
            className={`btn btn-sm ${activeTab === 'plan-gen' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Dumbbell size={16} /> แผนออกกำลังกาย
          </button>
          <button
            onClick={() => handleNavClick('chat')}
            className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <MessageSquare size={16} /> ผู้ช่วย AI
          </button>
          
          {isAuthenticated && (
            <button
              onClick={() => handleNavClick('history')}
              className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <History size={16} /> ประวัติ
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`btn btn-sm ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderColor: '#f59e0b', color: activeTab === 'admin' ? '#fff' : '#f59e0b' }}
            >
              <Shield size={16} /> Admin
            </button>
          )}

          <button
            onClick={() => handleNavClick('about')}
            className={`btn btn-sm ${activeTab === 'about' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <HelpCircle size={16} /> เกี่ยวกับ
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-icon"
            title="สลับธีม สว่าง/มืด"
            style={{ marginLeft: '0.25rem' }}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
          </button>

          {/* User Profile / Auth Button */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <button
                onClick={() => handleNavClick('profile')}
                className={`btn btn-sm ${activeTab === 'profile' ? 'btn-accent' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="avatar"
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <User size={16} />
                )}
                <span>{user?.username || 'โปรไฟล์'}</span>
              </button>
              <button
                onClick={logout}
                className="btn btn-danger btn-icon btn-sm"
                title="ออกจากระบบ"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="btn btn-primary btn-sm"
              style={{ marginLeft: '0.5rem' }}
            >
              <LogIn size={16} /> เข้าสู่ระบบ
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div style={{ display: 'none' }} className="mobile-toggle">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="btn btn-secondary btn-icon">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div style={{
          padding: '1rem 0',
          borderTop: '1px solid var(--border-color)',
          marginTop: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <button onClick={() => handleNavClick('home')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>หน้าหลัก</button>
          <button onClick={() => handleNavClick('food-scan')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><Camera size={16}/> สแกนอาหาร AI</button>
          <button onClick={() => handleNavClick('plan-gen')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><Dumbbell size={16}/> แผนออกกำลังกาย</button>
          <button onClick={() => handleNavClick('chat')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><MessageSquare size={16}/> ผู้ช่วย AI</button>
          {isAuthenticated && (
            <button onClick={() => handleNavClick('history')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><History size={16}/> ประวัติ</button>
          )}
          {isAdmin && (
            <button onClick={() => handleNavClick('admin')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', color: '#f59e0b' }}><Shield size={16}/> Admin Panel</button>
          )}
          <button onClick={() => handleNavClick('about')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><HelpCircle size={16}/> เกี่ยวกับ</button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={toggleTheme} className="btn btn-secondary">
              {theme === 'dark' ? <><Sun size={16}/> ธีมสว่าง</> : <><Moon size={16}/> ธีมมืด</>}
            </button>
            {isAuthenticated ? (
              <button onClick={logout} className="btn btn-danger"><LogOut size={16}/> ออกจากระบบ</button>
            ) : (
              <button onClick={() => { setIsMobileMenuOpen(false); openAuthModal('login'); }} className="btn btn-primary"><LogIn size={16}/> เข้าสู่ระบบ</button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
};
