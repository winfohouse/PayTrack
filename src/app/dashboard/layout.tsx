'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { Home, Briefcase, Users, DollarSign, Bell, LogOut, Menu, X } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { defaultAvater } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false); // for mobile sidebar

  return (
    <div className="flex h-screen bg-gray-100">
      {isOpen && <div className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden" onClick={() => setIsOpen(false)}></div>}
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md flex flex-col justify-between transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}
      >
        <div>
          <div className="p-6 flex items-center justify-between :block">
            <h1 className="text-2xl font-bold text-gray-800">PayTrack</h1>
            <button
              className="lg:hidden"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="mt-6" onClick={() => setIsOpen(false)}>
            <Link href="/dashboard" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-200">
              <Home className="w-5 h-5" />
              <span className="mx-4">Dashboard</span>
            </Link>
            <Link href="/dashboard/workers" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-200">
              <Users className="w-5 h-5" />
              <span className="mx-4">My Workers</span>
            </Link>
            <Link href="/dashboard/companies" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-200">
              <Briefcase className="w-5 h-5" />
              <span className="mx-4">My Companies</span>
            </Link>
            <Link href="/dashboard/jobs" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-200">
              <Briefcase className="w-5 h-5" />
              <span className="mx-4">Jobs</span>
            </Link>
            <Link href="/dashboard/requests" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-200">
              <Bell className="w-5 h-5" />
              <span className="mx-4">Requests</span>
            </Link>
          </nav>
        </div>

        {/* User profile + Logout */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={session?.user?.image || defaultAvater}
              alt={session?.user?.name || 'User'}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className='break-all'>
              <p className="text-sm font-medium text-gray-900">{session?.user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-500 border-2 rounded hover:bg-red-700 hover:text-amber-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white rounded shadow-md"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto ml-0">{children}</main>
    </div>
  );
}
