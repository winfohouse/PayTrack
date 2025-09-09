'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Payment } from '@prisma/client';
import { humanTime } from '@/lib/time'
import { JobFromApi } from '@/types/Responce';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const JobId = params.id;
  const { data: session } = useSession();
  const [job, setJob] = useState<JobFromApi | null>(null);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState(1000);
  const [discription, setDiscription] = useState("");

  const fetchJob = async () => {
    setLoading(true);
    const res = await fetch(`/api/jobs/${JobId}`);
    if (res.ok) {
      const data = await res.json();
      setJob(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJob();
  }, [JobId]);

  const handleAddPayment = async () => {
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: JobId, discription, amount }),
    });
    setAmount(0);
    setDiscription("");
    fetchJob();
  };

  const handleDeletePayment = async (paymentId: string) => {
    const res = await fetch(`/api/payments/${paymentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchJob();
    } else {
      const msg = await res.text();
      alert(msg);
    }
  };


  const handleConfirmPayment = async (paymentId: string) => {
    await fetch(`/api/payments/${paymentId}`, { method: 'PUT' });
    fetchJob();
  };

  const handleUpdateJobStatus = async (status: string) => {
    await fetch(`/api/jobs/${JobId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }
    );
    fetchJob();
  };

  if (loading) {
    return <div className="text-center py-20 text-xl font-semibold">Loading...</div>;
  }

  if (!job) {
    return <div className="text-center py-20 text-xl text-gray-500">Job not found.</div>;
  }

  const isCompany = session?.user?.id === job.companyId;
  const isWorker = session?.user?.id === job.assignedToId;

  // Calculate totals
  const totalPaid = job.payments
    .filter((p: Payment) => p.confirmed)
    .reduce((sum: number, p: Payment) => sum + p.amount, 0);

  const totalUnpaid = job.payments
    .filter((p: Payment) => !p.confirmed)
    .reduce((sum: number, p: Payment) => sum + p.amount, 0);

  const totalAmount = totalPaid + totalUnpaid;

  // Comparative values
  const remaining = job.agreedPrice - totalPaid;
  const advance = totalPaid - job.agreedPrice;
  const fullyPaid = remaining <= 0;

  return (
    <div className="space-y-10">
      {/* Job Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center sm:items-start flex-col sm:flex-row gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">{job.title}</CardTitle>
              <p className="text-gray-600 mt-1">{job.description}</p>
            </div>
            <Badge className="text-lg px-3 py-1">{job.status}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <p><strong>Company:</strong> {job.company.name}</p>
            <p><strong>Worker:</strong> {job.assignedTo.name}</p>
            <p><strong>Agreed Price:</strong> ${job.agreedPrice.toFixed(2)}</p>
            {job.dueDate && (
              <p>
                <strong>Due Date:</strong>{" "}
                <span
                  className={
                    new Date(job.dueDate) < new Date()
                      ? "text-red-600 font-medium"
                      : ""
                  }
                >
                  {(new Date(job.dueDate).toLocaleDateString() + " | " + humanTime(new Date(job.dueDate).getTime()))}
                </span>
              </p>
            )}
          </div>

          {/* Warning if overdue */}
          {job.dueDate && new Date(job.dueDate) < new Date() && (
            <div className="p-3 rounded-md bg-red-100 border border-red-300 text-red-700 text-sm font-medium">
              ⚠️ This job is overdue! Please take immediate action.
            </div>
          )}

          <p className="text-xs text-gray-500">
            Created: {new Date(job.createdAt).toLocaleDateString()} | Last Update:{" "}
            {humanTime(new Date(job.updatedAt).getTime())}
          </p>
        </CardContent>
      </Card>


      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold text-green-700">${totalPaid.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Total Paid</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold text-yellow-700">${totalUnpaid.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Unconfirmed Payments</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold text-blue-700">${job.agreedPrice.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Agreed Price</p>
          </CardContent>
        </Card>

        {/* Comparative Card */}
        <Card
          className={`p-6 text-center ${remaining > 0
            ? "bg-red-50 border-red-200"
            : advance > 0
              ? "bg-purple-50 border-purple-200"
              : "bg-green-50 border-green-200"
            }`}
        >
          <CardContent>
            {remaining > 0 ? (
              <>
                <p className="text-2xl font-bold text-red-600">
                  ${remaining.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Remaining to Pay</p>
              </>
            ) : advance > 0 ? (
              <>
                <p className="text-2xl font-bold text-purple-600">
                  ${advance.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Advance Paid</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-green-700">✔</p>
                <p className="text-sm text-gray-600">Fully Paid</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payments Section */}
      {job.payments.map((p: Payment) => {
        const isCreator = session?.user?.id === p.payerId; // 👈 make sure your Payment model has payerId
        const createdAt = new Date(p.createdAt);
        const now = new Date();
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const canDelete = isCreator && diffHours <= 2;

        return (
          <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border last:border-b-0 m-1">
            <div className="flex gap-6">
              <div className="flex flex-col items-start pr-6 border-r mr-4 min-w-[120px]">
                <p className="font-bold text-lg">${p.amount.toFixed(2)}</p>
                <p className="text-xs text-primary">
                  {new Date(p.createdAt).toLocaleString()}
                  <span className="mx-1 text-accent">•</span>
                  <span className="italic text-destructive">{humanTime(new Date(p.createdAt).getTime())}</span>
                </p>
              </div>
              <p className="text-gray-700">{p.discription}</p>
            </div>
            <div className="flex items-center gap-2">
              {p.confirmed ? (
                <Badge variant="secondary">Confirmed</Badge>
              ) : (
                <>
                  <Badge variant="outline">Unconfirmed</Badge>
                  {isWorker && (
                    <Button size="sm" onClick={() => handleConfirmPayment(p.id)}>
                      Confirm
                    </Button>
                  )}
                </>
              )}

              {/* 👇 Delete button (only if conditions are met) */}
              {canDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeletePayment(p.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        );
      })}


      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold">Add Payment</h2>
          <Card className="mt-4">
            <CardContent className="pt-6 space-y-4">
              <Input
                id="discription"
                type="text"
                value={discription}
                onChange={(e) => setDiscription(e.target.value)}
                placeholder="Payment description"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                  placeholder="Payment amount"
                />
                <Button onClick={handleAddPayment}>Add</Button>
              </div>
              <p className="text-sm text-gray-500">
                {isCompany
                  ? 'The worker will need to confirm this payment.'
                  : 'This payment will be marked as confirmed.'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold">Job Actions</h2>
          <Card className="mt-4">
            <CardContent className="pt-6 flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => handleUpdateJobStatus('IN_PROGRESS')}>In Progress</Button>
              <Button variant="outline" onClick={() => handleUpdateJobStatus('COMPLETED')}>Completed</Button>
              <Button variant="outline" onClick={() => handleUpdateJobStatus('PAID')}>Paid</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
