import React from 'react';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('../components/LiveMap'), { ssr: false });

const MapPage = () => {
  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-3xl font-bold text-slate-800">Live Maritime Map</h1>
        <p className="text-slate-600 mt-1">Real-time vessel positions and restricted zones / مواقع السفن والمناطق المحظورة في الوقت الحقيقي</p>
      </header>
      
      <div className="rounded-lg overflow-hidden w-full">
        <LiveMap />
      </div>

      {/* Optional: Filters or controls for the map */}
      {/* <div className="bg-white shadow-sm rounded-lg p-4"> */}
      {/*   <h2 className="text-lg font-semibold text-slate-700">Map Controls</h2> */}
      {/* </div> */}
    </div>
  );
};

export default MapPage; 