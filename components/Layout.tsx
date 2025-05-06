import React, { PropsWithChildren } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { ShieldCheckIcon, MapIcon, HomeIcon, CogIcon, UsersIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // Example icons

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const appName = "Algerian Maritime Monitor";
  const appNameArabic = "المرصد البحري الجزائري";

  // Navigation items for the sidebar
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', labelArabic: 'لوحة التحكم', icon: HomeIcon },
    { href: '/map', label: 'Live Map', labelArabic: 'الخريطة المباشرة', icon: MapIcon },
    { href: '/alerts', label: 'Alerts Log', labelArabic: 'سجل التنبيهات', icon: ExclamationTriangleIcon }, // Example new page
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Admin Overview', labelArabic: 'نظرة عامة للمسؤول', icon: CogIcon },
    { href: '/admin/fishers', label: 'Manage Fishers', labelArabic: 'إدارة الصيادين', icon: UsersIcon },
    { href: '/admin/zones', label: 'Manage Zones', labelArabic: 'إدارة المناطق', icon: ShieldCheckIcon },
  ];

  // Determine sidebar visibility: show only when user is signed in AND not on the public landing page ("/")
  const { isSignedIn } = useUser();
  const router = useRouter();
  const showSidebar = isSignedIn && router.pathname !== '/';

  return (
    <>
      <Head>
        <title>{appName}</title>
        <meta name="description" content={`${appName} - ${appNameArabic}`} />
        <link rel="icon" href="/favicon.ico" /> {/* Add a favicon later */}
      </Head>

      <div className="min-h-screen flex flex-col bg-slate-100">
        {/* Header */}
        <header className="bg-sky-700 text-sky-50 shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/" className="text-xl md:text-2xl font-bold hover:opacity-90 transition-opacity">
              {appName} <span className="text-sky-300 text-lg">({appNameArabic})</span>
            </Link>
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-md text-sm font-medium transition-colors">
                    Sign In / الدخول
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Sidebar */}
          {showSidebar && (
            <aside className="w-64 bg-slate-800 text-slate-200 p-4 space-y-6 shadow-lg hidden md:block">
              <nav className="space-y-2">
                <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Navigation</p>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-700 hover:text-sky-300 transition-all group"
                  >
                    <item.icon className="h-5 w-5 text-slate-400 group-hover:text-sky-300 transition-colors" />
                    <span>{item.label}</span>
                    {/* <span className="text-xs text-slate-400 group-hover:text-sky-300">({item.labelArabic})</span> */}
                  </Link>
                ))}
              </nav>

              {/* Admin Navigation - Potentially conditionally rendered based on user role */}
              <SignedIn> {/* Further role check needed here with useAuth/useUser from Clerk + Convex role */}
                <nav className="space-y-2 pt-4 border-t border-slate-700">
                  <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Tools</p>
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-700 hover:text-sky-300 transition-all group"
                    >
                      <item.icon className="h-5 w-5 text-slate-400 group-hover:text-sky-300 transition-colors" />
                      <span>{item.label}</span>
                      {/* <span className="text-xs text-slate-400 group-hover:text-sky-300">({item.labelArabic})</span> */}
                    </Link>
                  ))}
                </nav>
              </SignedIn>
            </aside>
          )}

          {/* Main Content Area */}
          <main className={`flex-1 overflow-y-auto ${router.pathname === '/' ? '' : 'p-4 md:p-6 lg:p-8'}`}>
            {children}
          </main>
        </div>

        {/* Footer (Optional) */}
        <footer className="bg-slate-800 text-slate-400 text-center p-4 text-sm border-t border-slate-700">
          &copy; {new Date().getFullYear()} {appName}. All rights reserved.
        </footer>
      </div>
    </>
  );
};

export default Layout; 