'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useJobs } from '@/contexts/JobContext';

interface JobStatusButtonProps {
  jobId: number;
  currentStatus?: string | null;
}

export function JobStatusButton({ jobId, currentStatus }: JobStatusButtonProps) {
  const { updateJobStatus } = useJobs();

  const statuses = [
    { value: 'new', label: 'New' },
    { value: 'applied', label: 'Applied' },
    { value: 'interview', label: 'Interview' },
    { value: 'rejected', label: 'Rejected' },
  ];

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
            onClick={() => updateJobStatus(jobId, status.value as any)}
          >
            {status.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 