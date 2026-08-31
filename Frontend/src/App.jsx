import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { BugReportModal } from './components/BugReportModal';

import { HomePage } from './pages/HomePage';
import { FoodScanPage } from './pages/FoodScanPage';
import { PlanGenPage } from './pages/PlanGenPage';
import { ChatPage } from './pages/ChatPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { AboutContactPage } from './pages/AboutContactPage';

const AppContent = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [tabParams, setTabParams] = useState(null);

  // Modals
  const [authModalMode, setAuthModalMode] = useState(null); // null | 'login' | 'register'
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);

  const navigateTo = (tab, params = null) => {
    // Protected tabs check
    if ((tab === 'history' || tab === 'profile') && !isAuthenticated) {
      setAuthModalMode('login');
      return;
    }
    if (tab === 'admin' && !isAdmin) {
      setActiveTab('home');
      return;
    }

    setTabParams(params);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={navigateTo}
        openAuthModal={(mode) => setAuthModalMode(mode)}
      />

      <main className="main-content">
        {activeTab === 'home' && (
          <HomePage
            onNavigate={navigateTo}
            onOpenAuth={(mode) => setAuthModalMode(mode)}
          />
        )}

        {activeTab === 'food-scan' && <FoodScanPage />}

        {activeTab === 'plan-gen' && <PlanGenPage initialParams={tabParams} />}

        {activeTab === 'chat' && <ChatPage />}

        {activeTab === 'history' && <HistoryPage />}

        {activeTab === 'profile' && <ProfilePage />}

        {activeTab === 'admin' && <AdminPage />}

        {activeTab === 'about' && (
          <AboutContactPage onOpenBugReport={() => setIsBugReportOpen(true)} />
        )}
      </main>

      <Footer
        onOpenBugReport={() => setIsBugReportOpen(true)}
        onNavigate={navigateTo}
      />

      {/* Auth Modal */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
        />
      )}

      {/* Bug Report Modal */}
      {isBugReportOpen && (
        <BugReportModal onClose={() => setIsBugReportOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
