import { JobList } from '@/components/JobList'
import { JobFilter } from '@/components/JobFilter'

export default async function JobsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Job Applications</h1>
      <JobFilter />
      <JobList />
    </div>
  );
} 