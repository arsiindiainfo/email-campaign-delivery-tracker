// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiPost } from '../../lib/apiClient';
import { BrandFooter } from '../../components/BrandFooter';

export function UnsubscribePage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    if (!token) return;
    apiPost(`/unsubscribe/${token}`)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          {status === 'loading' && <p className="text-sm text-slate-500">Processing your request…</p>}
          {status === 'done' && (
            <>
              <h1 className="text-lg font-semibold text-slate-900">You've been unsubscribed</h1>
              <p className="mt-2 text-sm text-slate-500">
                You won't receive any further marketing emails from this sender.
              </p>
            </>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-600">Something went wrong. This link may be invalid.</p>
          )}
        </div>
      </div>
      <BrandFooter />
    </div>
  );
}
