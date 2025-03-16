'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useJobs } from '@/contexts/JobContext';
import { useToast } from '@/hooks/use-toast';

interface JobStatusButtonProps {
  jobId: number;
  currentStatus?: string | null;
}

export function JobStatusButton({ jobId, currentStatus }: JobStatusButtonProps) {
  const { updateJobStatus } = useJobs();
  const { toast } = useToast();

  const statuses = [
    { value: 'new', label: 'New' },
    { value: 'applied', label: 'Applied' },
    { value: 'interview', label: 'Interview' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const handleStatusChange = async (status: 'new' | 'applied' | 'rejected' | 'interview') => {
    const statusLabel = statuses.find(s => s.value === status)?.label;
    try {
      await updateJobStatus(jobId, status);
      toast({
        title: "Status updated",
        description: `Job status changed to ${statusLabel}`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update job status",
        variant: "destructive"
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {currentStatus ? statuses.find(s => s.value === currentStatus)?.label : 'Set Status'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statuses.map((status) => (
          <DropdownMenuItem
            key={status.value}
            onClick={() => handleStatusChange(status.value as 'new' | 'applied' | 'rejected' | 'interview')}
          >
            {status.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 