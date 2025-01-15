import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Job Application Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Link 
          href="/jobs" 
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Job Applications</h2>
          <p className="text-gray-600">Manage your job applications</p>
        </Link>
        
        <Link 
          href="/scrape" 
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Scrape Jobs</h2>
          <p className="text-gray-600">Find new job listings</p>
        </Link>
      </div>
    </div>
  );
}