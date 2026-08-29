// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
const TONE_CLASSES = {
  ok: 'bg-green-100 text-green-800',
  warn: 'bg-amber-100 text-amber-800',
  bad: 'bg-red-100 text-red-800',
  idle: 'bg-slate-100 text-slate-600',
  info: 'bg-blue-100 text-blue-800',
} as const;

type Tone = keyof typeof TONE_CLASSES;

const STATUS_TONE: Record<string, Tone> = {
  DRAFT: 'idle',
  SCHEDULED: 'info',
  SENDING: 'info',
  PAUSED: 'warn',
  SENT: 'ok',
  CANCELLED: 'idle',
  QUEUED: 'idle',
  DELIVERED: 'ok',
  OPENED: 'ok',
  CLICKED: 'ok',
  BOUNCED: 'bad',
  COMPLAINED: 'bad',
  FAILED: 'bad',
  UNSUBSCRIBED: 'warn',
  ACTIVE: 'ok',
  SUPPRESSED: 'bad',
  PENDING: 'idle',
  PROCESSING: 'info',
  COMPLETED: 'ok',
};

export function StateBadge({ status, live }: { status: string; live?: boolean }) {
  const tone = STATUS_TONE[status] ?? 'idle';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${TONE_CLASSES[tone]}`}
    >
      {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {status}
      {live && <span className="normal-case font-normal opacity-70">live</span>}
    </span>
  );
}
