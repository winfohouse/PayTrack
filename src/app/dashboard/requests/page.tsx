'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { FromWorkerRequestResponce, ToWorkerRequestResponce } from '@/types/Responce';

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

export default function RequestsPage() {
  const [requests, setRequests] = useState<{ received: FromWorkerRequestResponce | [], sent: ToWorkerRequestResponce | [] }>({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await fetch('/api/worker-requests');
    const data = await res.json();
    setRequests({
      received: data.receivedRequests || [],
      sent: data.sentRequests || [],
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await fetch(`/api/worker-requests/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }
    );
    fetchRequests(); // Re-fetch to update the UI
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className='text-3xl font-bold'>Worker Requests</h1>

      <div className='mt-8'>
        <h2 className='text-2xl font-bold'>Received Requests</h2>
        <Card className='mt-4'>
          <CardContent className='p-0'>
            {requests.received.length > 0 ? (
              <ul className='divide-y'>
                {requests.received.map((req) => (
                  <li key={req.id} className='flex items-center justify-between p-4'>
                    <div>
                      <p className='font-semibold'>{req.fromUser.name}</p>
                      <p className='text-sm text-gray-500'>{req.fromUser.email}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant={req.status === 'PENDING' ? 'default' : req.status === 'APPROVED' ? 'secondary' : 'destructive'}>
                        {req.status}
                      </Badge>
                      {req.status === 'PENDING' && (
                        <>
                          <Button onClick={() => handleRequestUpdate(req.id, 'APPROVED')}>
                            Approve
                          </Button>
                          <Button variant='destructive' onClick={() => handleRequestUpdate(req.id, 'REJECTED')}>
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title='No received requests'
                description='When a user sends you a worker request, it will appear here.'
                icon={<Bell className='h-6 w-6 text-gray-500' />}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className='mt-8'>
        <h2 className='text-2xl font-bold'>Sent Requests</h2>
        <Card className='mt-4'>
          <CardContent className='p-0'>
            {requests.sent.length > 0 ? (
              <ul className='divide-y'>
                {requests.sent.map((req) => (
                  <li key={req.id} className='flex items-center justify-between p-4'>
                    <div>
                      <p className='font-semibold'>{req.toUser.name}</p>
                      <p className='text-sm text-gray-500'>{req.toUser.email}</p>
                    </div>
                    <Badge variant={req.status === 'PENDING' ? 'default' : req.status === 'APPROVED' ? 'secondary' : 'destructive'}>
                      {req.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title='No sent requests'
                description='Your sent worker requests will appear here.'
                icon={<Bell className='h-6 w-6 text-gray-500' />}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
