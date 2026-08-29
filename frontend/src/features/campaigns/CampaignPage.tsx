// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useParams } from 'react-router-dom';
import { ErrorState } from '../../components/EmptyState';
import { SkeletonBlock } from '../../components/Skeleton';
import { useCampaign } from './api';
import { CampaignDetailPage } from './CampaignDetailPage';
import { CampaignWizardPage } from './CampaignWizardPage';

export function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const { data: campaign, isLoading, isError, refetch } = useCampaign(isNew ? undefined : id);

  if (isNew) {
    return <CampaignWizardPage />;
  }

  if (isLoading) {
    return <SkeletonBlock className="h-96" />;
  }

  if (isError || !campaign) {
    return <ErrorState message="Failed to load this campaign" onRetry={() => void refetch()} />;
  }

  return campaign.status === 'DRAFT' ? <CampaignWizardPage existing={campaign} /> : <CampaignDetailPage campaign={campaign} />;
}
