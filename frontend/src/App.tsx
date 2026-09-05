// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './app/ProtectedRoute';
import { ToastProvider } from './components/ToastContext';
import { AdminContactsPage } from './features/admin/AdminContactsPage';
import { AdminSendLogPage } from './features/admin/AdminSendLogPage';
import { AdminUsersPage } from './features/admin/AdminUsersPage';
import { AuthProvider } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { VerifyEmailPage } from './features/auth/VerifyEmailPage';
import { CampaignPage } from './features/campaigns/CampaignPage';
import { CampaignsListPage } from './features/campaigns/CampaignsListPage';
import { ListDetailPage } from './features/contacts/ListDetailPage';
import { ListsPage } from './features/contacts/ListsPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { SuppressionsPage } from './features/suppressions/SuppressionsPage';
import { TemplateEditorPage } from './features/templates/TemplateEditorPage';
import { TemplatesListPage } from './features/templates/TemplatesListPage';
import { UnsubscribePage } from './features/unsubscribe/UnsubscribePage';
import { queryClient } from './lib/queryClient';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
              <Route path="/unsubscribe/:token" element={<UnsubscribePage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/campaigns" element={<CampaignsListPage />} />
                <Route path="/campaigns/:id" element={<CampaignPage />} />
                <Route path="/templates" element={<TemplatesListPage />} />
                <Route path="/templates/:id" element={<TemplateEditorPage />} />
                <Route path="/lists" element={<ListsPage />} />
                <Route path="/lists/:id" element={<ListDetailPage />} />
                <Route path="/suppressions" element={<SuppressionsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/contacts" element={<AdminContactsPage />} />
                <Route path="/admin/send-log" element={<AdminSendLogPage />} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
