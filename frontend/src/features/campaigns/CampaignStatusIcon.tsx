// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Calendar, FileEdit, Pause, Send, XCircle, type LucideIcon } from 'lucide-react';
import type { CampaignStatus } from '../../types/domain';

const STATUS_ICON: Record<CampaignStatus, { icon: LucideIcon; className: string }> = {
  DRAFT: { icon: FileEdit, className: 'bg-slate-100 text-slate-500' },
  SCHEDULED: { icon: Calendar, className: 'bg-blue-100 text-blue-600' },
  SENDING: { icon: Send, className: 'bg-indigo-100 text-indigo-600' },
  SENT: { icon: Send, className: 'bg-green-100 text-green-600' },
  PAUSED: { icon: Pause, className: 'bg-amber-100 text-amber-600' },
  CANCELLED: { icon: XCircle, className: 'bg-slate-100 text-slate-400' },
};

/** Small colored icon badge conveying a campaign's lifecycle status at a glance. */
export function CampaignStatusIcon({ status }: { status: CampaignStatus }) {
  const { icon: Icon, className } = STATUS_ICON[status];
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${className}`}>
      <Icon size={17} />
    </div>
  );
}
