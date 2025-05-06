import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api'; // Adjust path if necessary
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const AdminDashboardPage = () => {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <p className="text-slate-600">Please sign in to access the admin dashboard.</p>
      </div>
    );
  }

  // User is signed in; fetch their role
  const userRole = useQuery(api.users.getMyUserRole, {});

  if (userRole === null) {
    // User is signed in, but has no role assigned in Convex userRoles table yet.
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-orange-600">Role Not Assigned</h1>
        <p className="text-slate-600 mt-1">Your user role has not been configured in the system yet. Please contact an administrator.</p>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-slate-600 mt-1">You do not have permission to view this page. / ليس لديك إذن لعرض هذه الصفحة.</p>
      </div>
    );
  }

  // User is an admin
  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">System overview and management tools / نظرة عامة على النظام وأدوات الإدارة</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/fishers" className="block bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold text-sky-700 mb-2">Manage Fishers</h2>
          <p className="text-slate-500">View, register, and manage fisher profiles.</p>
        </Link>
        
        <Link href="/admin/zones" className="block bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold text-sky-700 mb-2">Manage Restricted Zones</h2>
          <p className="text-slate-500">Define and oversee monitored maritime zones.</p>
        </Link>
      </div>

      {/* Placeholder for other admin info/stats */}
      <div className="bg-white shadow-sm rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold text-slate-700 mb-3">System Statistics (Admin)</h2>
        <p className="text-slate-500">Placeholder for admin-specific statistics and system health.</p>
      </div>

    </div>
  );
};

export default AdminDashboardPage; 