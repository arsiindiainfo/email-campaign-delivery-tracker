// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BrandFooter } from '../../components/BrandFooter';
import { apiPost } from '../../lib/apiClient';

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    if (!token) return;
    apiPost(`/auth/verify-email/${token}`)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          {status === 'loading' && <p className="text-sm text-slate-500">Verifying your email&hellip;</p>}
          {status === 'done' && (
            <>
              <h1 className="text-lg font-semibold text-slate-900">Email verified</h1>
              <p className="mt-2 text-sm text-slate-500">Your account is active — you can sign in now.</p>
              <Link to="/login" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800">
                Go to sign in
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="text-lg font-semibold text-slate-900">Link invalid or expired</h1>
              <p className="mt-2 text-sm text-red-600">
                This verification link is invalid or has expired. Try registering again, or contact
                arsi.india.info@gmail.com for help.
              </p>
            </>
          )}
        </div>
      </div>
      <BrandFooter />
    </div>
  );
}
