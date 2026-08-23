import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthSession, User, UserRole, Permission } from '../models';
import { MOCK_USERS, DEMO_LOGINS } from '../mock/data';
import { ROLE_PERMISSIONS } from '../permissions/permissions';

interface AuthContextValue {
  session: AuthSession | null;
  login: (email: string, _password: string) => Promise<User>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  isAuthenticated: boolean;
  currentUser: User | null;
  currentRole: UserRole | null;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const stored = sessionStorage.getItem('auth_session');
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });

  const login = useCallback(async (email: string, _password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 800));

    const userId = DEMO_LOGINS[email.toLowerCase()];
    const user = MOCK_USERS.find(u => u.referenceId === userId || u.email === email.toLowerCase());

    if (!user) throw new Error('Invalid credentials. Use a demo account.');

    const newSession: AuthSession = { user, token: `tok_${Math.random().toString(36).slice(2)}` };
    setSession(newSession);
    sessionStorage.setItem('auth_session', JSON.stringify(newSession));
    return user;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    sessionStorage.removeItem('auth_session');
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!session) return false;
    const perms = ROLE_PERMISSIONS[session.user.role] ?? [];
    return perms.includes(permission);
  }, [session]);

  const switchRole = useCallback((role: UserRole) => {
    if (!session) return;
    const userForRole = MOCK_USERS.find(u => u.role === role);
    if (!userForRole) return;
    const newSession: AuthSession = { ...session, user: userForRole };
    setSession(newSession);
    sessionStorage.setItem('auth_session', JSON.stringify(newSession));
  }, [session]);

  return (
    <AuthContext.Provider value={{
      session,
      login,
      logout,
      hasPermission,
      isAuthenticated: !!session,
      currentUser: session?.user ?? null,
      currentRole: session?.user.role ?? null,
      switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
