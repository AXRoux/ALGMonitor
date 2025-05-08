import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useUser, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';

// You can create a more sophisticated loading component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-32">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-600"></div>
  </div>
);

const DashboardPage = () => {
  const { isSignedIn, user } = useUser();
  
  const activeVesselsCount = useQuery(api.users.getMyUserRole, isSignedIn ? {} : 'skip'); 
  const alertsTodayCount = 0; 
  const restrictedZonesCount = 0; 
  
  const userRoleQuery = useQuery(api.users.getMyUserRole, isSignedIn ? {} : 'skip') as
    | 'admin'
    | 'fisher'
    | undefined
    | 'skip';

  if (!isSignedIn) {
    return (
      <div className="text-center p-10">
        <p className="text-slate-600 text-lg">Please <SignInButton mode="modal"><button className="text-sky-600 hover:underline font-semibold">sign in</button></SignInButton> to view the dashboard.</p>
      </div>
    );
  }

  if (userRoleQuery === undefined || userRoleQuery === 'skip') {
    return <LoadingSpinner />;
  }

  const userRole = userRoleQuery as 'admin' | 'fisher'; 
  const welcomeName = user?.firstName || user?.username || (userRole === 'admin' ? 'Administrator' : 'User');

  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, {welcomeName}! / !مرحباً بعودتك، {welcomeName}</p>
      </header>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-700 mb-1">Active Vessels</h2>
          <p className="text-slate-500 text-sm mb-3">السفن النشطة</p>
          <p className="text-5xl font-bold text-sky-600">{typeof activeVesselsCount === 'number' ? activeVesselsCount : 'N/A'} </p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-700 mb-1">Alerts Today</h2>
          <p className="text-slate-500 text-sm mb-3">تنبيهات اليوم</p>
          <p className="text-5xl font-bold text-red-600">{alertsTodayCount}</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-700 mb-1">Restricted Zones</h2>
          <p className="text-slate-500 text-sm mb-3">المناطق المحظورة</p>
          <p className="text-5xl font-bold text-amber-600">{restrictedZonesCount}</p>
        </div>
      </div>

      {/* Quick Links / Actions based on role */}
      {userRole === 'admin' && (
        <div className="bg-white shadow-sm rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Admin Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/admin/fishers" className="px-5 py-2.5 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors text-sm font-medium">
              Manage Fishers
            </Link>
            <Link href="/admin/zones" className="px-5 py-2.5 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors text-sm font-medium">
              Manage Zones
            </Link>
            <Link href="/alerts" className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors text-sm font-medium">
              View Alert Logs
            </Link>
          </div>
        </div>
      )}

      {/* Placeholder for recent activity or other dashboard elements */}
      <div className="bg-white shadow-sm rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold text-slate-700 mb-3">Recent Activity</h2>
        <p className="text-slate-500">No recent activity to display / لا يوجد نشاط حديث لعرضه.</p>
      </div>

    </div>
  );
};

export default DashboardPage; 