// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { AppShell } from './AppShell';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell />;
}
