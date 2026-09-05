// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Lightbulb } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { SelectField } from '../../components/SelectField';
import { Stepper } from '../../components/Stepper';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/ToastContext';
import { ApiError } from '../../lib/apiClient';
import { useOrganization } from '../organizations/api';
import { useTemplate, useTemplates } from '../templates/api';
import { useLists } from '../contacts/api';
import type { Campaign } from '../../types/domain';
import { useCreateCampaign, useScheduleCampaign, useSendTest, useUpdateCampaign } from './api';

const STEPS = ['Details', 'Recipients', 'Content', 'Review & Schedule'] as const;

const SAMPLE_VALUES: Record<string, string> = { firstName: 'Asha', lastName: 'Rao', unsubscribeUrl: '#unsubscribe-preview' };
function renderPreview(html: string): string {
  return html.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (m, k: string) => SAMPLE_VALUES[k] ?? m);
}

export function CampaignWizardPage({ existing }: { existing?: Campaign }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: organization } = useOrganization();
  const { data: templatesPage } = useTemplates({ limit: 100 });
  const { data: listsPage } = useLists({ limit: 100 });

  const [step, setStep] = useState(0);
  const [name, setName] = useState(existing?.name ?? '');
  const [subject, setSubject] = useState(existing?.subject ?? '');
  const [fromName, setFromName] = useState(existing?.fromName ?? organization?.name ?? '');
  const [fromEmail, setFromEmail] = useState(existing?.fromEmail ?? '');
  const [listIds, setListIds] = useState<string[]>(existing?.listIds ?? []);
  const [templateId, setTemplateId] = useState(existing?.templateId ?? '');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [testEmails, setTestEmails] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adjust state during render rather than in an effect (see the matching
  // comment in TemplateEditorPage.tsx) — applies the org's default sender
  // once, the first time it becomes available, for a brand-new campaign only.
  const [appliedOrgDefaults, setAppliedOrgDefaults] = useState(false);
  if (!existing && !appliedOrgDefaults && organization) {
    setAppliedOrgDefaults(true);
    if (!fromEmail && organization.senderDomain) setFromEmail(`hello@${organization.senderDomain}`);
    if (!fromName && organization.name) setFromName(organization.name);
  }

  const { data: template } = useTemplate(templateId || undefined);
  const createCampaign = useCreateCampaign();
  // Hooks must run unconditionally (Rules of Hooks) — pass a placeholder id
  // when there's no existing campaign yet; the mutations are simply never
  // invoked in that case (see ensureSaved/handleSendTest below).
  const updateCampaign = useUpdateCampaign(existing?.id ?? '');
  const scheduleCampaign = useScheduleCampaign(existing?.id ?? '');
  const sendTest = useSendTest(existing?.id ?? '');

  const recipientCount = useMemo(
    () => (listsPage?.data ?? []).filter((l) => listIds.includes(l.id)).reduce((sum, l) => sum + l.contactCount, 0),
    [listsPage, listIds],
  );

  const stepValid = [
    !!name && !!subject && !!fromName && !!fromEmail,
    listIds.length > 0,
    !!templateId,
    scheduleMode === 'now' || !!scheduledAt,
  ];

  const canProceed = stepValid[step];

  const buildPayload = () => ({ name, subject, fromName, fromEmail, templateId, listIds });

  const ensureSaved = async (): Promise<string> => {
    if (existing) {
      await updateCampaign.mutateAsync({ ...buildPayload(), version: existing.version });
      return existing.id;
    }
    const created = await createCampaign.mutateAsync(buildPayload());
    return created.id;
  };

  const handleSendTest = async () => {
    setError(null);
    try {
      const id = await ensureSaved();
      const emails = testEmails.split(',').map((e) => e.trim()).filter(Boolean);
      if (!existing) {
        navigate(`/campaigns/${id}`);
        return;
      }
      await sendTest.mutateAsync(emails);
      showToast(`Test sent to ${emails.length} address(es)`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to send test');
    }
  };

  const handleConfirmSchedule = async () => {
    setError(null);
    try {
      const id = await ensureSaved();
      if (!existing || existing.id !== id) {
        navigate(`/campaigns/${id}`);
        return;
      }
      await scheduleCampaign.mutateAsync(scheduleMode === 'now' ? {} : { scheduledAt: new Date(scheduledAt).toISOString() });
      showToast(scheduleMode === 'now' ? 'Campaign is sending now' : `Campaign scheduled for ${new Date(scheduledAt).toLocaleString()}`);
      navigate(`/campaigns/${id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to schedule campaign');
    } finally {
      setShowConfirm(false);
    }
  };

  const handleSaveDraft = async () => {
    setError(null);
    try {
      const id = await ensureSaved();
      showToast('Draft saved');
      if (!existing) navigate(`/campaigns/${id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to save draft');
    }
  };

  const isSaving = createCampaign.isPending || updateCampaign.isPending;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-xl font-semibold text-slate-900">{existing ? `Edit "${existing.name}"` : 'New campaign'}</h1>

      <Stepper steps={STEPS} currentStep={step} onStepClick={(i) => i < step && setStep(i)} />

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {step === 0 && (
          <div className="space-y-4">
            <TextField label="Campaign name" required value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
            <TextField label="From name" required value={fromName} onChange={(e) => setFromName(e.target.value)} />
            <TextField
              label="From email"
              required
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              helperText={organization?.senderDomain ? `Must use verified domain: ${organization.senderDomain}` : undefined}
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Select one or more lists *</p>
            <div className="space-y-2">
              {(listsPage?.data ?? []).map((l) => (
                <label key={l.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm">
                  <input
                    type="checkbox"
                    checked={listIds.includes(l.id)}
                    onChange={(e) =>
                      setListIds((prev) => (e.target.checked ? [...prev, l.id] : prev.filter((id) => id !== l.id)))
                    }
                  />
                  {l.name} <span className="text-slate-400">({l.contactCount} contacts)</span>
                </label>
              ))}
              {(listsPage?.data ?? []).length === 0 && <p className="text-sm text-slate-500">No lists yet — create one first.</p>}
            </div>
            {listIds.length > 0 && (
              <p className="mt-3 text-sm text-slate-600">Approximate recipients: {recipientCount.toLocaleString()}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SelectField label="Template" required value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">Select a template…</option>
              {(templatesPage?.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </SelectField>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Preview</p>
              <div className="rounded-md border border-slate-200 p-3">
                {template ? (
                  <div dangerouslySetInnerHTML={{ __html: renderPreview(template.htmlBody) }} />
                ) : (
                  <p className="text-sm text-slate-400">Select a template to preview it</p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              <p><strong>{name}</strong> — {subject}</p>
              <p>From: {fromName} &lt;{fromEmail}&gt;</p>
              <p>Lists: {listIds.length} selected — ~{recipientCount.toLocaleString()} recipients</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={scheduleMode === 'now'} onChange={() => setScheduleMode('now')} /> Send now
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={scheduleMode === 'later'} onChange={() => setScheduleMode('later')} /> Schedule for later
              </label>
            </div>
            {scheduleMode === 'later' && (
              <TextField label="Send at" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            )}

            <div className="border-t border-slate-100 pt-4">
              <TextField
                label="Send test email (comma-separated, up to 5)"
                value={testEmails}
                onChange={(e) => setTestEmails(e.target.value)}
              />
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => void handleSendTest()} isLoading={sendTest.isPending}>
                Send test
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-2 sm:order-1">
          {step > 0 && (
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
        </div>
        <div className="order-1 flex gap-2 sm:order-2">
          <Button variant="ghost" className="flex-1 sm:flex-none" onClick={() => void handleSaveDraft()} isLoading={isSaving}>
            Save draft
          </Button>
          {step < STEPS.length - 1 ? (
            <Button className="flex-1 sm:flex-none" disabled={!canProceed} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button className="flex-1 sm:flex-none" disabled={!canProceed} onClick={() => setShowConfirm(true)}>
              Confirm & schedule
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Confirm campaign send"
        description={`This will send to ~${recipientCount.toLocaleString()} recipients — continue?`}
        confirmLabel="Confirm"
        isLoading={scheduleCampaign.isPending || createCampaign.isPending}
        onConfirm={() => void handleConfirmSchedule()}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="mt-4 flex items-start gap-2 rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-sm text-indigo-800">
        <Lightbulb size={16} className="mt-0.5 shrink-0" />
        <span>Tip: You can save this campaign as a draft and continue later.</span>
      </div>
    </div>
  );
}
