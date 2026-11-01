import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { CommunicationHub } from './components/communication/CommunicationHub';
import { GuardCheckIn } from './components/guard/GuardCheckIn';
import { ManagementMonitor } from './components/management/ManagementMonitor';
import { SplitView } from './components/SplitView';
import { CompanyBrandingModal } from './components/common/CompanyBrandingModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const { isLoggedIn, isPortaria, isDirecao, loading } = useAuth();

  // If on login tab or unauthenticated (except for the open public communication area)
  if (activeTab === 'login') {
    return <LoginScreen />;
  }

  // Communication & Voice area is publicly accessible without login
  if (activeTab === 'communication') {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CommunicationHub />
        <CompanyBrandingModal />
      </main>
    );
  }

  // Other areas (Portaria, Direção, Visão Integrada) require authentication
  if (!isLoggedIn && !loading) {
    return <LoginScreen />;
  }

  // Role based access enforcement
  if (isPortaria && (activeTab === 'management' || activeTab === 'split')) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-900 shadow-xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Acesso Restrito à Direção
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              O seu perfil atual autenticado no Firestore é <strong>Portaria (Vigia)</strong>. O painel de monitoramento executivo é restrito à Direção.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('guard')}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel da Portaria</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {activeTab === 'guard' && <GuardCheckIn />}
      {activeTab === 'management' && <ManagementMonitor />}
      {activeTab === 'split' && <SplitView />}
      <CompanyBrandingModal />
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:text-emerald-200">
          <Header />
          <div className="flex-1">
            <MainContent />
          </div>
          <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 py-4 mt-12 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">PortaPonto 360</span>
                <span className="mx-2">·</span>
                <span>Portaria, Comunicação TTS e Gestão de Direção com Firebase Auth & Firestore</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Firebase Online
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>Versão Corporativa 2.5</span>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </AppProvider>
  );
}
