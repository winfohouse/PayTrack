'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Briefcase, Users } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  discription: string;
  agreedPrice: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAID';
  dueDate?: string;
}

interface WorkerRequest {
  id: string;
  fromUser: {
    id: string;
    name: string;
  };
  status: 'PENDING' | 'APPROVED' | 'DENIED';
}

interface DashboardSummary {
  jobsAsCompany: Job[];
  jobsAsWorker: Job[];
  receivedRequests: WorkerRequest[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<DashboardSummary>({
    jobsAsCompany: [],
    jobsAsWorker: [],
    receivedRequests: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, requestsRes] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/worker-requests'),
        ]);

        const jobsData = await jobsRes.json();
        const requestsData = await requestsRes.json();

        // Only show pending requests
        const pendingRequests = (requestsData.receivedRequests || []).filter(
          (req: WorkerRequest) => req.status === 'PENDING'
        );

        setSummary({
          jobsAsCompany: jobsData.jobsAsCompany || [],
          jobsAsWorker: jobsData.jobsAsWorker || [],
          receivedRequests: pendingRequests,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  const activeJobs = [
    ...summary.jobsAsCompany,
    ...summary.jobsAsWorker,
  ].filter((job, index, self) =>
    (job.status === 'PENDING' || job.status === 'IN_PROGRESS') &&
    index === self.findIndex(j => j.id === job.id) // remove duplicates
  );

  const recentJobs = activeJobs
    .sort((a, b) => (new Date(b.dueDate || '').getTime() - new Date(a.dueDate || '').getTime()))
    .slice(0, 5);

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-gray-900">Welcome, {session?.user?.name}</h1>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-5 rounded-xl shadow-md bg-white flex flex-col items-start">
          <div className="flex items-center gap-2 text-gray-700">
            <Briefcase className="w-5 h-5" /> Jobs as Company
          </div>
          <div className="text-3xl font-bold mt-2">{summary.jobsAsCompany.length}</div>
        </div>

        <div className="p-5 rounded-xl shadow-md bg-white flex flex-col items-start">
          <div className="flex items-center gap-2 text-gray-700">
            <Briefcase className="w-5 h-5" /> Jobs as Worker
          </div>
          <div className="text-3xl font-bold mt-2">{summary.jobsAsWorker.length}</div>
        </div>

        <div className="p-5 rounded-xl shadow-md bg-white flex flex-col items-start">
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-5 h-5" /> Pending Requests
          </div>
          <div className="text-3xl font-bold mt-2">{summary.receivedRequests.length}</div>
        </div>
      </div>

      {/* Pending Worker Requests */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Pending Worker Requests</h2>
        {summary.receivedRequests.length > 0 ? (
          <div className="space-y-3">
            {summary.receivedRequests.map((req) => req.status === "PENDING" && (
              <div
                key={req.id}
                className="p-4 rounded-xl shadow hover:shadow-lg bg-gray-50 flex justify-between items-center"
              >
                <p className="text-gray-800 font-medium">{req.fromUser.name} wants to add you as a worker.</p>
                <Link href="/dashboard/requests">
                  <button className="px-4 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
                    View
                  </button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pending requests.</p>
        )}
      </div>

      {/* Recent Jobs */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Jobs</h2>
        {recentJobs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl shadow-md hover:shadow-lg bg-white transition">
                <h3 className="font-semibold text-lg">{job.title}</h3>
                <p className="font-semibold ">{job.discription || ""}</p>
                <p className="font-semibold text-red-600">${job.agreedPrice}</p>
                <p className={`mt-2 font-medium ${job.status === 'IN_PROGRESS'
                    ? 'text-yellow-600'
                    : job.status === 'COMPLETED'
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}>
                  {job.status.replace('_', ' ')}
                </p>
                {job.dueDate && <p className="mt-1 text-sm text-gray-500">Due: {new Date(job.dueDate).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent jobs found.</p>
        )}
      </div>
    </div>
  );
}
