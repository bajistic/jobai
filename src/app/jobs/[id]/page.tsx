import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { JobActions } from '@/components/JobActions'
import { CoverLetterSection } from '@/components/CoverLetterSection'
import { formatDate } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { Job } from '@/lib/types/shared'

export default async function JobDetailsPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const job = await prisma.jobs.findUnique({
    where: { id: parseInt(params.id) },
    include: { cover_letters: true }
  })

  if (!job) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-gray-600">{job.company}</p>
          <p className="text-gray-500">{job.location}</p>
          <p className="text-sm text-gray-500">Posted: {job.published ? formatDate(job.published) : 'Not specified'}</p>
        </div>
        <JobActions job={{...job, id: Number(job.id)}} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <ReactMarkdown>
                {job.description || 'No description available'}
              </ReactMarkdown>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-gray-600">Workload</dt>
                <dd>{job.workload || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Contract</dt>
                <dd>{job.contract || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Canton</dt>
                <dd>{job.canton || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Status</dt>
                <dd className="capitalize">{job.status || 'Not specified'}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div>
          <CoverLetterSection job={job as unknown as Job} />
        </div>
      </div>
    </div>
  )
} 