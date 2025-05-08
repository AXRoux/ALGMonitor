import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRightIcon, MapPinIcon, BellAlertIcon, WrenchScrewdriverIcon, CheckCircleIcon, GlobeAmericasIcon, PhoneArrowUpRightIcon } from '@heroicons/react/24/outline';
import { SignedIn, SignInButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const LandingPage = () => {
  const appName = "Algerian Maritime Monitor";
  const appNameArabic = "المرصد البحري الجزائري";
  const { isSignedIn } = useUser();

  // Primary feature highlights
  const featureData = [
    {
      icon: <MapPinIcon className="w-10 h-10 text-sky-600 mb-4 group-hover:text-sky-500 transition-colors duration-300" />,
      title: "Real-Time Tracking", titleArabic: "التتبع في الوقت الحقيقي",
      description: "Monitor vessel positions live on an interactive map, ensuring continuous awareness within designated maritime zones."
    }, {
      icon: <BellAlertIcon className="w-10 h-10 text-red-600 mb-4 group-hover:text-red-500 transition-colors duration-300" />,
      title: "Instant Zone Alerts", titleArabic: "تنبيهات فورية للمناطق",
      description: "Receive immediate notifications when vessels enter or exit predefined restricted areas, enabling quick action."
    }, {
      icon: <WrenchScrewdriverIcon className="w-10 h-10 text-emerald-600 mb-4 group-hover:text-emerald-500 transition-colors duration-300" />,
      title: "Admin Control Panel", titleArabic: "لوحة تحكم المسؤول",
      description: "Manage fisher profiles, define restricted zones, and access comprehensive alert logs through a secure interface."
    }
  ];

  // Secondary 3-step overview
  const howItWorks = [
    {
      icon: <CheckCircleIcon className="w-10 h-10 text-emerald-600 mb-4" />,
      title: 'Connect Devices',
      description: 'AIS feeds are securely connected to our cloud platform in minutes.'
    },
    {
      icon: <GlobeAmericasIcon className="w-10 h-10 text-sky-600 mb-4" />,
      title: 'Track in Real-Time',
      description: 'Positions update live on an interactive nautical map with 24/7 availability.'
    },
    {
      icon: <PhoneArrowUpRightIcon className="w-10 h-10 text-red-600 mb-4" />,
      title: 'Receive Alerts',
      description: 'SMS and in-app alerts are triggered the moment rule violations occur.'
    }
  ];

  // Storytelling sections with imagery
  type StoryBlock = {
    title: string;
    titleArabic: string;
    description: string;
    imageUrl: string;
  };

  const storyBlocks: StoryBlock[] = [
    {
      title: 'Safeguarding a Proud Maritime Heritage',
      titleArabic: 'حماية التراث البحري الجزائري',
      description:
        "Algeria's 1,600 km of coastline has supported communities for centuries. Our platform helps preserve that legacy by monitoring illegal activities and protecting sustainable fishing.",
      imageUrl:
        'https://images.unsplash.com/photo-1535585538107-e457d37fbde5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      title: 'Situational Awareness in Real-Time',
      titleArabic: 'الوعي الظرفي في الوقت الحقيقي',
      description:
        'Live AIS feeds, geofencing logic and instant alerts give authorities the insight they need to act decisively, day or night.',
      imageUrl:
        'https://images.unsplash.com/photo-1504610926078-a1611febcad3?auto=format&fit=crop&w=1950&q=80',
    },
    {
      title: 'Swift Response & Coordination',
      titleArabic: 'استجابة سريعة وتنسيق فعال',
      description:
        'Time saved is lives saved. SMS and in-app notifications ensure commanders are informed the moment boundaries are breached, enabling rapid mobilisation of coast-guard assets.',
      imageUrl:
        'https://images.unsplash.com/photo-1612705671103-adda1148ff2c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  ];

  return (
    <>
      <Head>
        <title>Welcome to {appName}</title>
        <meta name="description" content={`Welcome to ${appName} - ${appNameArabic}. Advanced maritime monitoring and security.`} />
        <style jsx global>{`
          body {
            --header-height: 0px; /* Assuming landing page might not have the main layout header or it's different */
          }
        `}</style>
      </Head>

      {/* Hero Section - Full viewport height MINUS the site header (if any on this page) */}
      <div className="min-h-[calc(100vh-var(--header-height))] flex flex-col justify-center items-center text-center px-4 bg-linear-to-br from-sky-700 via-sky-600 to-emerald-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-white/10"></div>

        <div className="relative z-10 max-w-3xl mx-auto py-16 md:py-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            {appName}
            <span className="block text-sky-300 text-2xl sm:text-3xl mt-2 font-normal">{appNameArabic}</span>
          </h1>
          <p className="text-lg sm:text-xl text-sky-100 max-w-2xl mx-auto mb-10">
            Advanced real-time monitoring and alert systems for ensuring safety and security within Algerian waters. This platform is for authorized administrative personnel.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {!isSignedIn && (
              <SignInButton mode="modal">
                <Button 
                  size="lg" 
                  className="group bg-emerald-600 hover:bg-emerald-500 shadow-xl text-lg px-8 py-6 transform transition-all duration-300 hover:scale-105 focus:ring-emerald-400 focus:ring-offset-sky-800"
                  aria-label="Admin Login / تسجيل دخول المسؤول"
                  tabIndex={0}
                >
                  Admin Login / تسجيل الدخول
                  <ArrowRightIcon className="w-5 h-5 ml-2.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </SignInButton>
            )}
            {isSignedIn && (
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl text-lg px-8 py-6 transform transition-all duration-300 hover:scale-105 focus:ring-emerald-400 focus:ring-offset-sky-800 inline-flex items-center gap-2">
                <Link href="/dashboard" aria-label="Go to Dashboard / الذهاب إلى لوحة التحكم" tabIndex={0}>
                  <span>Go to Dashboard / لوحة التحكم</span>
                  <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 text-white" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Features Section using Shadcn Card */}
      <section className="py-16 md:py-24 bg-slate-100" id="features">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-14 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">Empowering Maritime Oversight</h2>
            <p className="text-lg text-slate-600 mt-4 max-w-xl mx-auto">Key functionalities for comprehensive monitoring and rapid response by administrators.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {featureData.map(feature => (
              <Card key={feature.title} className="group bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-slate-200 flex flex-col text-center md:text-left">
                <CardHeader className="items-center md:items-start">
                  {feature.icon}
                  <CardTitle className="text-xl text-slate-800 group-hover:text-sky-600 transition-colors duration-300">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">{feature.titleArabic}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-base leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-100" id="how-it-works">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-14 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">How It Works</h2>
            <p className="text-lg text-slate-600 mt-4 max-w-xl mx-auto">
              Three simple steps to get your maritime monitoring up and running.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {howItWorks.map((step, idx) => (
              <Card key={step.title} className="bg-slate-50 hover:bg-white transition-colors duration-300 shadow-sm hover:shadow-md border-slate-200 text-center p-8 flex flex-col items-center">
                {step.icon}
                <h3 className="text-xl font-semibold text-slate-800 mb-2">{`${idx + 1}. ${step.title}`}</h3>
                <p className="text-slate-600 leading-relaxed text-base">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Storytelling image + text blocks */}
      {storyBlocks.map((block, idx) => (
        <section
          key={block.title}
          className={`py-16 md:py-24 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
        >
          <div className="container mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12 md:gap-20">
            {/* Image */}
            <div
              className={`w-full md:w-1/2 rounded-lg overflow-hidden shadow-md ${
                idx % 2 === 1 ? 'md:order-2' : ''
              }`}
            >
              <img
                src={block.imageUrl}
                alt={block.title}
                className="w-full h-64 md:h-96 object-cover"
                loading="lazy"
              />
            </div>

            {/* Text */}
            <div className="w-full md:w-1/2">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-tight">
                {block.title}
              </h3>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                {block.description}
              </p>
              <span className="block text-sky-700 font-medium">{block.titleArabic}</span>
            </div>
          </div>
        </section>
      ))}

      {/* Call To Action Section */}
      <section className="py-16 md:py-24 bg-linear-to-br from-emerald-700 via-sky-700 to-sky-800 text-white relative overflow-hidden" id="cta">
        <div className="absolute inset-0 opacity-5 bg-white/10"></div>
        <div className="container mx-auto px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 max-w-3xl mx-auto">Ready to safeguard Algeria&apos;s shores?</h2>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-sky-100">
            Join the Algerian Maritime Monitor platform today and gain unparalleled situational awareness.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {!isSignedIn && (
              <SignInButton mode="modal">
                <Button size="lg" className="group bg-white text-emerald-700 hover:bg-slate-100 shadow-lg px-8 py-6 text-lg transition-all duration-300 hover:scale-105 focus:ring-slate-300 focus:ring-offset-emerald-800" aria-label="Admin Login" tabIndex={0}>
                  Secure Admin Login
                  <ArrowRightIcon className="w-5 h-5 ml-2.5 transition-transform duration-300 group-hover:translate-x-1 text-emerald-700" />
                </Button>
              </SignInButton>
            )}
            {isSignedIn && (
              <Button asChild size="lg" className="bg-sky-600 hover:bg-sky-500 text-white shadow-lg px-8 py-6 text-lg transition-all duration-300 hover:scale-105 focus:ring-sky-300 focus:ring-offset-emerald-800 inline-flex items-center gap-2">
                <Link href="/dashboard" aria-label="Go to Dashboard" tabIndex={0}>
                  <span>Go to Dashboard</span>
                  <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 text-white" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default LandingPage;
