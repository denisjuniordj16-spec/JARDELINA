import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === 'denis.junior.dj16@gmail.vom' || clean === 'denis.junior.dj16@gmail.com';
};

export const AUTH_STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER_EMAIL: 'auth_user_email',
};

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  authToken: string | null;
  loading: boolean;
  loginError: string | null;
  isLoggedIn: boolean;
  isPortaria: boolean;
  isDirecao: boolean;
  isAdmin: boolean;
  canAccessGuard: boolean;
  canAccessManagement: boolean;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; perfil?: UserRole; error?: string }>;
  quickLogin: (role: UserRole | 'admin') => Promise<{ success: boolean; perfil?: UserRole; error?: string }>;
  logout: () => Promise<void>;
  clearLoginError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Preset accounts for frictionless testing and role verification
export const PRESET_ACCOUNTS = {
  admin: {
    email: 'denis.junior.dj16@gmail.vom',
    alternateEmail: 'denis.junior.dj16@gmail.com',
    password: 'borborema2107',
    nome: 'Denis Junior (Administrador & Direção)',
    perfil: 'direção' as UserRole,
  },
  portaria: {
    email: 'porteiro@portaponto.com.br',
    password: 'porteiro123',
    nome: 'Carlos Silva (Portaria & Vigia)',
    perfil: 'portaria' as UserRole,
  },
  direcao: {
    email: 'direcao@portaponto.com.br',
    password: 'direcao123',
    nome: 'Diretoria Geral & Monitoramento',
    perfil: 'direção' as UserRole,
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Helper to fetch or create user document in Firestore 'usuarios' collection
  const fetchOrCreateUserProfile = useCallback(async (firebaseUser: User, fallbackRole?: UserRole): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'usuarios', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      const emailLower = (firebaseUser.email || '').toLowerCase();
      const isAdminUser = isAuthorizedAdminEmail(emailLower);

      if (userSnap.exists()) {
        const data = userSnap.data();
        let role = (data.perfil === 'portaria' || data.perfil === 'direção' ? data.perfil : 'portaria') as UserRole;
        if (isAdminUser) {
          role = 'direção';
        }
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: data.email || firebaseUser.email || '',
          nome: data.nome || (isAdminUser ? 'Denis Junior (Administrador)' : 'Usuário'),
          perfil: role,
          ativo: data.ativo ?? true,
          createdAt: data.createdAt,
        };
        return profile;
      }

      // If document doesn't exist yet, infer role from email or fallback
      let initialRole: UserRole = fallbackRole || 'portaria';
      let initialName = 'Porteiro em Serviço';

      if (isAdminUser) {
        initialRole = 'direção';
        initialName = 'Denis Junior (Administrador)';
      } else if (emailLower.includes('direcao') || emailLower.includes('gestao') || emailLower.includes('admin')) {
        initialRole = 'direção';
        initialName = 'Diretoria & Monitoramento';
      } else if (emailLower.includes('porteiro') || emailLower.includes('vigia') || emailLower.includes('portaria')) {
        initialRole = 'portaria';
        initialName = 'Carlos Silva (Porteiro)';
      }

      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        nome: initialName,
        perfil: initialRole,
        ativo: true,
        createdAt: new Date().toISOString(),
      };

      await setDoc(userRef, {
        email: newProfile.email,
        nome: newProfile.nome,
        perfil: newProfile.perfil,
        ativo: newProfile.ativo,
        createdAt: newProfile.createdAt,
      });

      return newProfile;
    } catch (err) {
      console.error('Error fetching/creating user profile in Firestore:', err);
      // Fallback in-memory profile if Firestore write is blocked
      const isDenis = (firebaseUser.email || '').toLowerCase().includes('denis');
      const fallback: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        nome: isDenis ? 'Denis Junior (Administrador)' : fallbackRole === 'direção' ? 'Diretoria & Monitoramento' : 'Porteiro em Serviço',
        perfil: isDenis ? 'direção' : fallbackRole || 'portaria',
        ativo: true,
      };
      return fallback;
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          localStorage.setItem('auth_token', token);
          if (currentUser.email) {
            localStorage.setItem('auth_user_email', currentUser.email);
          }
          setAuthToken(token);
        } catch (e) {
          console.warn('Erro ao obter token do Firebase:', e);
        }
        const profile = await fetchOrCreateUserProfile(currentUser);
        setUserProfile(profile);
      } else {
        const storedToken = localStorage.getItem('auth_token');
        if (!storedToken) {
          setUserProfile(null);
          setAuthToken(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [fetchOrCreateUserProfile]);

  // Login with Email & Password
  const loginWithCredentials = useCallback(async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; perfil?: UserRole; error?: string }> => {
    setLoading(true);
    setLoginError(null);

    const cleanEmail = email.trim().toLowerCase();
    const firebaseAuthEmail = cleanEmail.endsWith('@gmail.vom')
      ? cleanEmail.replace('@gmail.vom', '@gmail.com')
      : cleanEmail;

    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, firebaseAuthEmail, pass);
      } catch (signInErr: any) {
        // If user doesn't exist, auto-register known preset accounts (including denis.junior.dj16@gmail.vom / .com)
        const isAdminPreset = isAuthorizedAdminEmail(cleanEmail);
        const isPreset =
          isAdminPreset ||
          cleanEmail === PRESET_ACCOUNTS.portaria.email ||
          cleanEmail === PRESET_ACCOUNTS.direcao.email;

        if (isPreset && (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential')) {
          const role: UserRole = cleanEmail === PRESET_ACCOUNTS.portaria.email ? 'portaria' : 'direção';
          userCredential = await createUserWithEmailAndPassword(auth, firebaseAuthEmail, pass);
          const profile = await fetchOrCreateUserProfile(userCredential.user, role);
          if (profile && cleanEmail.includes('.vom')) {
            profile.email = cleanEmail;
          }

          // 1. Save authentication token in localStorage after login
          const token = await userCredential.user.getIdToken();
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user_email', cleanEmail);
          setAuthToken(token);

          setUser(userCredential.user);
          setUserProfile(profile);
          setLoading(false);
          return { success: true, perfil: profile?.perfil || role };
        }
        throw signInErr;
      }

      // Check perfil in collection 'usuarios'
      const profile = await fetchOrCreateUserProfile(userCredential.user);
      if (!profile || !profile.ativo) {
        throw new Error('Conta desativada ou não autorizada pelo administrador.');
      }

      if (profile && cleanEmail.includes('.vom')) {
        profile.email = cleanEmail;
      }

      // 1. Save authentication token in localStorage after login
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user_email', cleanEmail);
      setAuthToken(token);

      setUser(userCredential.user);
      setUserProfile(profile);
      setLoading(false);
      return { success: true, perfil: profile.perfil };
    } catch (err: any) {
      setLoading(false);
      let message = 'Falha ao autenticar. Verifique o e-mail e a senha informados.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = 'Senha incorreta ou credencial inválida para este usuário.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'Nenhum usuário cadastrado com este e-mail.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'O formato de e-mail informado é inválido.';
      } else if (err.message) {
        message = err.message;
      }
      setLoginError(message);
      return { success: false, error: message };
    }
  }, [fetchOrCreateUserProfile]);

  // Fast 1-click test login
  const quickLogin = useCallback(async (role: UserRole | 'admin') => {
    let preset = PRESET_ACCOUNTS.portaria;
    if (role === 'admin') preset = PRESET_ACCOUNTS.admin;
    else if (role === 'direção') preset = PRESET_ACCOUNTS.direcao;
    return loginWithCredentials(preset.email, preset.password);
  }, [loginWithCredentials]);

  // Logout - removes token from localStorage
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      // 3. Use localStorage.removeItem on logout
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user_email');
      setAuthToken(null);
      setUser(null);
      setUserProfile(null);
      setLoginError(null);
    }
  }, []);

  const clearLoginError = useCallback(() => setLoginError(null), []);

  const isPortaria = userProfile?.perfil === 'portaria';
  const isDirecao = userProfile?.perfil === 'direção';
  const isLoggedIn = !!userProfile;
  const isAdmin = isLoggedIn && isAuthorizedAdminEmail(userProfile?.email || user?.email);
  // Permit access to the administration layout ONLY if the logged in user is denis.junior.dj16@gmail.vom (or .com)
  const canAccessManagement = isAdmin;

  const value: AuthContextType = {
    user,
    userProfile,
    authToken,
    loading,
    loginError,
    isLoggedIn,
    isPortaria,
    isDirecao,
    isAdmin,
    canAccessGuard: isPortaria || isDirecao,
    canAccessManagement,
    loginWithCredentials,
    quickLogin,
    logout,
    clearLoginError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
