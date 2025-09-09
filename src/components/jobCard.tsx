'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';
import { JobFromApi } from '@/types/job';
import { humanTime } from '@/lib/time';

interface JobCardProps {
  job: JobFromApi;
  href?: string; // optional, defaults to dashboard/job/id
}

export default function JobCard({ job, href }: JobCardProps) {
  const isOverdue = job.dueDate && new Date(job.dueDate) < new Date();

  const statusColor = () => {
    switch (job.status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link href={href || `/dashboard/jobs/${job.id}`}>
      <Card className="hover:shadow-xl transition-shadow duration-300 rounded-2xl border border-gray-200">
        <CardHeader className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-500" />
            {job.title}
          </CardTitle>
          <Badge className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor()}`}>
            {job.status}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-2 text-gray-700">
          <p>
            <strong>Agreed Price:</strong> ${job.agreedPrice.toFixed(2)}
          </p>
          {job.assignedTo?.name && (
            <p>
              <strong>Assigned To:</strong> {job.assignedTo.name}
            </p>
          )}
          {job.company?.name && (
            <p>
              <strong>Company:</strong> {job.company.name}
            </p>
          )}
          {job.dueDate && (
            <p>
              <strong>Deadline:</strong>{' '}
              <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-800'}>
                {new Date(job.dueDate).toLocaleDateString()} | {humanTime(new Date(job.dueDate).getTime())}
              </span>
            </p>
          )}

          {/* Overdue warning */}
          {isOverdue && (
            <div className="mt-2 p-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
              ⚠️ This job is overdue!
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
