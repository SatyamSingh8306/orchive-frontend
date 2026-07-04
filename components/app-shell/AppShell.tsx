'use client';

import { useSidebar, SidebarProvider } from '@/contexts/SidebarContext';
import AppSidebar from './AppSidebar';

function AppShellContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className="paper min-h-screen text-[var(--ink)]">
      <div className="flex min-h-screen">
        {/* Collapsible Sidebar */}
        <div
          className={`fixed left-0 top-0 z-50 h-screen transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: '280px' }}
        >
          <AppSidebar />
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="mono fixed top-1/2 z-40 inline-flex h-10 w-6 -translate-y-1/2 items-center justify-center border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
          style={{ left: isSidebarOpen ? '280px' : '0px' }}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <svg
            className="h-4 w-4 transition-transform duration-300"
            style={{
              transform: isSidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'ml-[280px]' : 'ml-0'
          }`}
        >
          <div className="min-h-screen">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  );
}
