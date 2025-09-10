'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { defaultAvater } from '@/lib/utils';
import { Briefcase, Mail, Users } from 'lucide-react';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface WorkerJob {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PAID";
  dueDate: string | null;
  agreedPrice: number;
}

interface ActiveWorker {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  jobsAsWorker: WorkerJob[];
}

export default function WorkersPage() {
  const { data: session } = useSession();

  const [workers, setWorkers] = useState<ActiveWorker[]>([]);
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [requestSending, setRequestSending] = useState(false);
  const [message, setMessage] = useState('');

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/worker');
      const data: { workers: ActiveWorker[] } = await res.json();
      setWorkers(data.workers);
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // Check if email is empty
    if (!email) {
      setMessage('Please enter an email.');
      return;
    }

    // Prevent sending request to self
    if (email.toLowerCase() === session?.user?.email?.toLowerCase()) {
      setMessage("You can't send a request to yourself.");
      return;
    }

    // Check if user is already an active worker
    const alreadyWorker = workers.some(
      (worker) => worker.email?.toLowerCase() === email.toLowerCase()
    );
    if (alreadyWorker) {
      setMessage('This user is already your worker.');
      setRequestSending(false);
      return;
    }

    setRequestSending(true);
    try {
      // 1. Find user by email
      const userRes = await fetch(`/api/users/find-by-email/${email}`);
      if (!userRes.ok) {
        setMessage('User not found.');
        return;
      }
      const user = await userRes.json();

      // 2. Send worker request
      const reqRes = await fetch('/api/worker-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: user.id }),
      });

      if (reqRes.ok) {
        setMessage('Worker request sent successfully!');
        setEmail('');
        fetchWorkers(); // refresh active workers
      } else {
        const errorData = await reqRes.json();
        setMessage(errorData.message || 'Failed to send worker request.');
      }
    } catch (error) {
      console.error(error);
      setMessage('An error occurred.');
    } finally { setRequestSending(false); }
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name?.toLowerCase().includes(search.toLowerCase()) ||
    worker.email?.toLowerCase().includes(search.toLowerCase())
  );

  const renderJobBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PAID':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className='space-y-8'>
      <h1 className='text-3xl font-bold text-gray-900'>My Workers</h1>


      {/* Add Worker Form */}
      <Card className='max-w-md'>
        <CardHeader>
          <CardTitle>Add a New Worker</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddWorker} className='flex flex-col sm:flex-row items-center gap-2'>
            <Input
              type='email'
              placeholder="Worker's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='flex-1'
            />
            <Button type='submit' className='mt-2 sm:mt-0' disabled={requestSending} >Send Request</Button>
          </form>
          {message && <p className='mt-2 text-sm text-gray-600'>{message}</p>}
        </CardContent>
      </Card>

      {/* Workers List */}
      <h1 className='text-3xl font-bold text-gray-900'>My Workers</h1>

      {/* Search */}
      <Input
        type='text'
        placeholder='Search by name or email'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className='max-w-md'
      />

      {/* Workers List */}
      {filteredWorkers.length > 0 ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredWorkers.map(worker => (
            <Card key={worker.id} className='border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200'>
              <CardHeader className='flex flex-row items-center gap-3'>
                <img
                  src={worker.image || defaultAvater}
                  alt={worker.name || 'Worker'}
                  className='h-12 w-12 rounded-full object-cover'
                />
                <div className='flex-1'>
                  <CardTitle className='text-md font-semibold'>{worker.name}</CardTitle>
                  <p className='text-sm text-gray-500 flex gap-1 break-all'>
                    <Mail className='h-6 w-6' /> {worker.email}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-sm font-medium mb-2 flex items-center gap-1 text-gray-700'>
                  <Briefcase className='h-4 w-4' /> Assigned Jobs:
                </p>
                <ul className='space-y-1 max-h-56 overflow-y-auto'>
                  {worker.jobsAsWorker.length > 0 ? (
                    worker.jobsAsWorker
                      .sort((a, b) => a.status.localeCompare(b.status)) // sort by status
                      .map((job) => (
                        <Link href={"/dashboard/jobs/" + job.id} key={job.id} className='flex justify-between items-center p-2 rounded-md hover:bg-gray-50'>
                          <div className='flex flex-col'>
                            <span className='font-medium'>{job.title}</span>
                            <span className='text-xs text-gray-500'>
                              {job.dueDate ? `Due: ${new Date(job.dueDate).toLocaleDateString()}` : 'No deadline'} | ${job.agreedPrice.toFixed(2)}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${renderJobBadge(job.status)}`}
                          >
                            {job.status.replace('_', ' ')}
                          </span>
                        </Link>
                      ))
                  ) : (
                    <li className='text-gray-500 text-sm'>No jobs assigned</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className='text-center py-16'>
          <div className='mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-gray-100'>
            <Users className='h-6 w-6 text-gray-500' />
          </div>
          <h3 className='mt-4 text-lg font-semibold text-gray-900'>No workers yet</h3>
          <p className='mt-1 text-sm text-gray-500'>You don’t have any active workers.</p>
        </div>
      )}
    </div>
  );
}
