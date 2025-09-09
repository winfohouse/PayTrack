'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Briefcase } from 'lucide-react';
import { JobFromApi, ToWorkerRequestResponce } from '@/types/Responce';
import JobCard from '@/components/jobCard';

function EmptyState({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className='text-center py-12'>
      <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-200'>
        {icon}
      </div>
      <h3 className='mt-4 text-lg font-medium text-gray-900'>{title}</h3>
      <p className='mt-1 text-sm text-gray-500'>{description}</p>
    </div>
  );
}

function CreateJobDialog({ workers, onJobCreated }: { workers: ToWorkerRequestResponce | [], onJobCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('5000');
  const [dueDate, setDueDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)).toString());
  const [assignedToId, setAssignedToId] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, agreedPrice, dueDate, assignedToId }),
    });

    if (res.ok) {
      onJobCreated();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Create New Job</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg rounded-2xl border border-gray-200 shadow-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Job</DialogTitle>
          <DialogDescription className="text-gray-500">
            Assign a job to one of your workers by filling out the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="sm:col-span-3" />
          </div>

          {/* Agreed Price */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <Label htmlFor="agreedPrice" className="text-sm font-medium">Agreed Price</Label>
            <Input id="agreedPrice" type="number" value={agreedPrice} onChange={(e) => setAgreedPrice(e.target.value)} className="sm:col-span-3" />
          </div>

          {/* Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <Label htmlFor="dueDate" className="text-sm font-medium">Deadline</Label>
            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="sm:col-span-3" />
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-3" />
          </div>

          {/* Assign Worker */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <Label htmlFor="worker" className="text-sm font-medium">Assign To</Label>
            <Select onValueChange={setAssignedToId} value={assignedToId}>
              <SelectTrigger className="sm:col-span-3">
                <SelectValue placeholder="Select a worker" />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.toUser.id} value={worker.toUser.id}>
                    {worker.toUser.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
            Create Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<{ asCompany: JobFromApi[], asWorker: JobFromApi[] }>({ asCompany: [], asWorker: [] });
  const [workers, setWorkers] = useState<ToWorkerRequestResponce | []>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    const res = await fetch('/api/jobs');
    const data = await res.json();
    setJobs({
      asCompany: data.jobsAsCompany || [],
      asWorker: data.jobsAsWorker || [],
    });
  };

  const fetchWorkers = async () => {
    const res = await fetch('/api/worker-requests');
    const data = await res.json();
    if (data.sentRequests) {
      const approvedWorkers = (data.sentRequests as ToWorkerRequestResponce).filter((req) => req.status === 'APPROVED');
      setWorkers(approvedWorkers as ToWorkerRequestResponce);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchJobs(), fetchWorkers()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Jobs</h1>
        <CreateJobDialog workers={workers} onJobCreated={fetchJobs} />
      </div>

      <div className='mt-8'>
        <h2 className='text-2xl font-bold'>Jobs as Company</h2>
        {jobs.asCompany.length > 0 ? (
          <div className='grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3'>
            {jobs.asCompany.map((job) => <JobCard key={job.id} job={job} href={`/dashboard/jobs/${job.id}`} />)}
          </div>
        ) : (
          <EmptyState
            title='No jobs created yet'
            description="Click 'Create New Job' to assign a job to one of your workers."
            icon={<Briefcase className='h-6 w-6 text-gray-500' />}
          />
        )}
      </div>

      <div className='mt-8'>
        <h2 className='text-2xl font-bold'>Jobs as Worker</h2>
        {jobs.asWorker.length > 0 ? (
          <div className='grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3'>
            {jobs.asWorker.map((job) => <JobCard key={job.id} job={job} href={`/dashboard/jobs/${job.id}`} />)}
          </div>
        ) : (
          <EmptyState
            title='No jobs assigned to you'
            description='When a company assigns a job to you, it will appear here.'
            icon={<Briefcase className='h-6 w-6 text-gray-500' />}
          />
        )}
      </div>
    </div>
  );
}
