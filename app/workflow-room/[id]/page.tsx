import WorkflowRoom from '@/components/workflow-room/WorkflowRoom';
import { SidebarProvider } from '@/contexts/SidebarContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowRoomPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <SidebarProvider>
      <WorkflowRoom workflowId={id} />
    </SidebarProvider>
  );
}
