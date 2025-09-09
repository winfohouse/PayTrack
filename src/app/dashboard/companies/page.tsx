'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { defaultAvater } from '@/lib/utils';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PAID";
  dueDate: string | null;
  agreedPrice: number;
}

interface CompanyWithJobs {
  requestId: string;
  company: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  jobs: Job[];
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithJobs[]>([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/companies');
        const data: CompanyWithJobs[] = await res.json();
        setCompanies(data);
      } catch (err) {
        console.error("Failed to fetch companies", err);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Companies</h1>
      {companies.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-200">
            <Briefcase className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No companies yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            When a company adds you as a worker, they will appear here.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((item) => (
          <Card key={item.requestId} className="border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center gap-3">
              <img
                src={item.company.image || defaultAvater}
                alt={item.company.name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <CardTitle className="text-md font-semibold">{item.company.name}</CardTitle>
                <p className="text-sm text-gray-500  break-all">{item.company.email}</p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-2 flex items-center gap-1 text-gray-700">
                <Briefcase className="h-4 w-4" /> Active Jobs:
              </p>
              {item.jobs.length > 0 ? (
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {item.jobs.map((job) => (
                    <Link href={"/dashboard/jobs/"+job.id} key={job.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                      <span>{job.title}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          job.status === "IN_PROGRESS"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </Link>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No active jobs</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
