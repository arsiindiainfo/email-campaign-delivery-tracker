// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { SkeletonBlock } from '../../components/Skeleton';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/ToastContext';
import { ApiError } from '../../lib/apiClient';
import { useCreateTemplate, useTemplate, useUpdateTemplate } from './api';

const MERGE_FIELDS = ['{{firstName}}', '{{lastName}}', '{{unsubscribeUrl}}'];
const SAMPLE_VALUES: Record<string, string> = {
  firstName: 'Asha',
  lastName: 'Rao',
  unsubscribeUrl: '#unsubscribe-preview',
};

function renderPreview(html: string): string {
  return html.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key: string) => SAMPLE_VALUES[key] ?? match);
}

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: template, isLoading } = useTemplate(isNew ? undefined : id);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate(id ?? '');

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Adjust form state during render rather than in an effect (React's
  // recommended pattern for "reset state when a prop/query result changes")
  // — avoids an extra render pass and the set-state-in-effect lint warning.
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | undefined>(undefined);
  if (template && template.id !== loadedTemplateId) {
    setLoadedTemplateId(template.id);
    setName(template.name);
    setSubject(template.subject);
    setHtmlBody(template.htmlBody);
  }

  const hasUnsubscribeTag = htmlBody.includes('{{unsubscribeUrl}}');
  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  const handleSave = async () => {
    setError(null);
    if (!hasUnsubscribeTag) {
      setError('Every template needs an unsubscribe link — insert {{unsubscribeUrl}}');
      return;
    }
    try {
      if (isNew) {
        const created = await createTemplate.mutateAsync({ name, subject, htmlBody });
        showToast('Template created');
        navigate(`/templates/${created.id}`);
      } else {
        await updateTemplate.mutateAsync({ name, subject, htmlBody });
        showToast('Template saved');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to save template');
    }
  };

  if (!isNew && isLoading) {
    return <SkeletonBlock className="h-96" />;
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">{isNew ? 'New template' : 'Edit template'}</h1>
      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">HTML body *</label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {MERGE_FIELDS.map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => setHtmlBody((prev) => prev + field)}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  {field}
                </button>
              ))}
            </div>
            <textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={16}
              className={`w-full rounded-md border px-3 py-2 font-mono text-xs shadow-sm outline-none ${
                !hasUnsubscribeTag && htmlBody ? 'border-amber-400' : 'border-slate-300 focus:border-indigo-500'
              }`}
            />
            {!hasUnsubscribeTag && (
              <p className="mt-1 text-xs text-amber-600">
                Every template needs an unsubscribe link — insert {'{{unsubscribeUrl}}'}
              </p>
            )}
          </div>
          <Button onClick={() => void handleSave()} isLoading={isSaving}>
            Save template
          </Button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Live preview</label>
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 border-b border-slate-100 pb-2 text-sm font-medium text-slate-700">
              {renderPreview(subject) || <span className="text-slate-400">Subject preview</span>}
            </div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderPreview(htmlBody) || '<p class="text-slate-400">Body preview</p>' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
