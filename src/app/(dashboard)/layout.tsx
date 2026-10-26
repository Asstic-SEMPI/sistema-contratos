import React from 'react';
import { getUserProfile } from '@/lib/auth/get-user-profile';
import { AppNavigation } from '@/components/layout/AppNavigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getUserProfile();

  return (
    <AppNavigation userEmail={user?.email} profile={profile}>
      {children}
    </AppNavigation>
  );
}
