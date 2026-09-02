// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { apiPost } from '../../lib/apiClient';
import { tokenStorage } from '../../lib/tokenStorage';
import type { Organization, User } from '../../types/domain';

interface AuthResponse {
  user: User;
  organization: Organization;
  accessToken: string;
  refreshToken: string;
}

interface RegisterInput {
  organizationName: string;
  name: string;
  email: string;
  password: string;
  recaptchaToken: string;
}

interface LoginInput {
  email: string;
  password: string;
  recaptchaToken: string;
}

interface AuthContextValue {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  setOrganization: (organization: Organization) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = 'ect.user';
const ORG_KEY = 'ect.organization';

function readStored<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStored<User>(USER_KEY));
  const [organization, setOrganizationState] = useState<Organization | null>(() => readStored<Organization>(ORG_KEY));

  const persist = useCallback((auth: AuthResponse) => {
    tokenStorage.setTokens(auth.accessToken, auth.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    localStorage.setItem(ORG_KEY, JSON.stringify(auth.organization));
    setUser(auth.user);
    setOrganizationState(auth.organization);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const auth = await apiPost<AuthResponse>('/auth/login', input);
      persist(auth);
    },
    [persist],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const auth = await apiPost<AuthResponse>('/auth/register', input);
      persist(auth);
    },
    [persist],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORG_KEY);
    setUser(null);
    setOrganizationState(null);
  }, []);

  const setOrganization = useCallback((org: Organization) => {
    localStorage.setItem(ORG_KEY, JSON.stringify(org));
    setOrganizationState(org);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, organization, isAuthenticated: !!user, login, register, logout, setOrganization }),
    [user, organization, login, register, logout, setOrganization],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider/context
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
