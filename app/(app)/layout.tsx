'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppShell from '@/components/app-shell/AppShell';
import { WorkflowSelectionProvider } from '@/components/app-shell/WorkflowContext';

export default function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <WorkflowSelectionProvider>
        <AppShell>{children}</AppShell>
      </WorkflowSelectionProvider>
    </ProtectedRoute>
  );
}
