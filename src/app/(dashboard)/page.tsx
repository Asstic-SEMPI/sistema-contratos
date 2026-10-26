import React from 'react';
import { getDashboardBIData } from '@/actions/bi-analytics.actions';
import { DashboardBIAnalytics } from '@/components/dashboard/bi/DashboardBIAnalytics';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const dataset = await getDashboardBIData();

  return <DashboardBIAnalytics dataset={dataset} />;
}
