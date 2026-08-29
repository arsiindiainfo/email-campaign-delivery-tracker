// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useState } from 'react';
import { Button } from '../../components/Button';
import type { Column } from '../../components/DataTable';
import { DataTable } from '../../components/DataTable';
import { SelectField } from '../../components/SelectField';
import { StateBadge } from '../../components/StateBadge';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/ToastContext';
import { ApiError } from '../../lib/apiClient';
import type { Role, User } from '../../types/domain';
import { useInviteMember, useOrganization, useTeamMembers, useUpdateOrganization, useVerifySender } from '../organizations/api';

const TABS = ['Organization', 'Team', 'API / Webhooks'] as const;
type Tab = (typeof TABS)[number];

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Organization');

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Settings</h1>
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Organization' && <OrganizationTab />}
      {tab === 'Team' && <TeamTab />}
      {tab === 'API / Webhooks' && <WebhooksTab />}
    </div>
  );
}

function OrganizationTab() {
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();
  const verifySender = useVerifySender();
  const { showToast } = useToast();

  const [senderDomain, setSenderDomain] = useState('');
  const [senderEmail, setSenderEmail] = useState('');

  // Adjust form state during render rather than in an effect — see the
  // matching comment in TemplateEditorPage.tsx for why.
  const [loadedOrgId, setLoadedOrgId] = useState<string | undefined>(undefined);
  if (organization && organization.id !== loadedOrgId) {
    setLoadedOrgId(organization.id);
    setSenderDomain(organization.senderDomain ?? '');
    setSenderEmail(organization.senderEmail ?? '');
  }

  if (isLoading || !organization) return null;

  const handleSave = async () => {
    try {
      await updateOrganization.mutateAsync({ senderDomain, senderEmail });
      showToast('Organization settings saved');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Failed to save', 'error');
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Sender verification:</span>
        <StateBadge status={organization.senderVerified ? 'ACTIVE' : 'PENDING'} />
      </div>
      <TextField label="Sender domain" value={senderDomain} onChange={(e) => setSenderDomain(e.target.value)} placeholder="yourcompany.demo" />
      <TextField label="Sender email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="hello@yourcompany.demo" />
      <div className="flex gap-2">
        <Button onClick={() => void handleSave()} isLoading={updateOrganization.isPending}>
          Save
        </Button>
        {!organization.senderVerified && (
          <Button
            variant="secondary"
            onClick={() => void verifySender.mutateAsync().then(() => showToast('Sender domain verified'))}
            isLoading={verifySender.isPending}
          >
            Verify sender (demo)
          </Button>
        )}
      </div>
    </div>
  );
}

function TeamTab() {
  const { data, isLoading } = useTeamMembers({ limit: 20 });
  const inviteMember = useInviteMember();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MARKETER');
  const [error, setError] = useState<string | null>(null);

  const cols: Column<User>[] = [
    { header: 'Name', render: (u) => u.name },
    { header: 'Email', render: (u) => u.email },
    { header: 'Role', render: (u) => <StateBadge status={u.role} /> },
  ];

  const handleInvite = async () => {
    setError(null);
    try {
      const result = await inviteMember.mutateAsync({ name, email, role });
      showToast(`Invited ${result.user.name} — temp password: ${result.tempPassword}`);
      setShowForm(false);
      setName('');
      setEmail('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to invite member');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Button onClick={() => setShowForm((v) => !v)}>Invite team member</Button>
      </div>
      {showForm && (
        <div className="mb-4 grid max-w-xl grid-cols-1 gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-3">
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={error ?? undefined} />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="ADMIN">Admin</option>
            <option value="MARKETER">Marketer</option>
            <option value="ANALYST">Analyst</option>
          </SelectField>
          <div className="sm:col-span-3">
            <Button onClick={() => void handleInvite()} isLoading={inviteMember.isPending}>
              Send invite
            </Button>
          </div>
        </div>
      )}
      <DataTable columns={cols} rows={data?.data ?? []} rowKey={(u) => u.id} isLoading={isLoading} />
    </div>
  );
}

function WebhooksTab() {
  const [copied, setCopied] = useState(false);
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api/v1';
  const webhookUrl = `${baseUrl}/webhooks/ses`;

  return (
    <div className="max-w-lg space-y-3">
      <p className="text-sm text-slate-600">Configure this URL as your SES/SNS delivery notification destination.</p>
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <code className="flex-1 truncate text-xs text-slate-700">{webhookUrl}</code>
        <button
          onClick={() => {
            void navigator.clipboard.writeText(webhookUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
