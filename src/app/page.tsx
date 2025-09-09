'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
      <div className='p-8 bg-white rounded shadow-md text-center'>
        <h1 className='text-4xl font-bold'>Welcome to PayTrack</h1>
        <p className='mt-2 text-lg text-gray-600'>
          The ultimate platform for managing payments between companies and workers.
        </p>
        <div className='mt-6 space-x-4'>
          <Link href='/login'>
            <Button size='lg'>Login</Button>
          </Link>
          <Link href='/register'>
            <Button size='lg' variant='outline'>
              Register
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
