import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { CompanyEmblem } from '../common/CompanyEmblem';
import {
  Lock,
  Mail,
  Volume2,
  LogIn,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Activity,
  ShieldCheck,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials, loginError, clearLoginError, loading } = useAuth();
  const { companySettings, setActiveTab } = useApp();

  // Campos limpos por padrão
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [destinationPanel, setDestinationPanel] = useState<'management' | 'guard'>('management');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  // Check token with localStorage.getItem upon loading and redirect to panel if it exists
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const storedEmail = (localStorage.getItem('auth_user_email') || '').toLowerCase();
      const isAdmin =
        storedEmail === 'denis.junior.dj16@gmail.vom' ||
        storedEmail === 'denis.junior.dj16@gmail.com' ||
        storedEmail.includes('denis');
      setActiveTab(isAdmin ? 'management' : 'guard');
    }
  }, [setActiveTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    setRedirectNotice(null);

    const result = await loginWithCredentials(email, password);
    setIsSubmitting(false);

    if (result.success && result.perfil) {
      const cleanEmail = email.trim().toLowerCase();
      const isAdmin = cleanEmail === 'denis.junior.dj16@gmail.vom' || cleanEmail === 'denis.junior.dj16@gmail.com';
      const welcomeName = isAdmin ? 'Denis Junior' : result.perfil === 'direção' ? 'Direção' : 'Portaria';

      if (destinationPanel === 'management') {
        if (!isAdmin) {
          setRedirectNotice(`Bem-vindo, ${welcomeName}! O layout de administração é restrito a denis.junior.dj16@gmail.vom. Redirecionando para a Portaria...`);
          setTimeout(() => setActiveTab('guard'), 1000);
        } else {
          setRedirectNotice(`Bem-vindo, ${welcomeName}! Acesso de administrador autorizado. Redirecionando para o Monitoramento da Direção...`);
          setTimeout(() => setActiveTab('management'), 500);
        }
      } else {
        setRedirectNotice(`Bem-vindo, ${welcomeName}! Acesso autorizado. Redirecionando para o Painel da Portaria...`);
        setTimeout(() => setActiveTab('guard'), 500);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Top Banner / Corporate Identity */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-3">
          <CompanyEmblem settings={companySettings} size="lg" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {companySettings.name}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Sistema Seguro de Controle de Acesso e Ponto · Validação Firebase Auth & Coleção Firestore
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dedicated Login Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Autenticação de Operadores & Direção
              </h2>
              <p className="text-xs text-slate-400">
                Acesso com o mesmo e-mail tanto para o Monitoramento da Direção quanto para a Portaria
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium">{loginError}</div>
              <button
                type="button"
                onClick={clearLoginError}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Success / Redirection Notice */}
          {redirectNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 animate-spin" />
              <div className="flex-1 font-bold">{redirectNotice}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Escolha do Painel de Destino */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Painel que deseja acessar com este e-mail:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDestinationPanel('management')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    destinationPanel === 'management'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Monitoramento Direção</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDestinationPanel('guard')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    destinationPanel === 'guard'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Portaria (Vigia)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  inputMode="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (loginError) clearLoginError();
                  }}
                  placeholder="exemplo@empresa.com"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Senha
                </label>
                <span className="text-[11px] text-slate-400">Texto protegido</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginError) clearLoginError();
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full mt-2 py-3 px-4 text-xs sm:text-sm font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting || loading ? (
                <span>Validando credenciais no Firebase...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>
                    Entrar no {destinationPanel === 'management' ? 'Monitoramento da Direção' : 'Painel da Portaria'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Public Access Area & Role Explanations */}
        <div className="lg:col-span-5 space-y-4">
          {/* Public Access Card (Sem Login) */}
          <div className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                Acesso Livre · Sem Login
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/20 rounded-2xl">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Comunicação & Voz</h3>
            </div>

            <p className="text-xs text-sky-100 leading-relaxed mb-5">
              Área aberta para ouvir comunicados em áudio via síntese de voz (TTS), verificar comunicados urgentes da portaria e avisos corporativos sem necessidade de senha.
            </p>

            <button
              type="button"
              onClick={() => setActiveTab('communication')}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-900 hover:bg-sky-50 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Acessar Comunicação & Voz Agora</span>
              <ArrowRight className="w-4 h-4 text-sky-600" />
            </button>
          </div>

          {/* Role Specification & Firestore Architecture Information */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-xs space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Controle de Acesso Unificado</span>
            </h4>

            <div className="space-y-2 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
                <strong className="text-indigo-950 dark:text-indigo-200 block font-semibold mb-0.5">
                  Monitoramento em Tempo Real da Direção
                </strong>
                Com o seu e-mail cadastrado, você acessa a visão executiva completa: ponto dos colaboradores, alertas de atraso, controle e saldo de folgas e gestão da empresa.
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white block font-semibold mb-0.5">
                  Painel de Batida de Ponto da Portaria
                </strong>
                O mesmo e-mail também permite operar ou inspecionar o registro de ponto dos funcionários no turno regulamentar das 06:00 às 12:00.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
