import React from 'react';

const AlertsLogPage = () => {
  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-3xl font-bold text-slate-800">Alerts Log</h1>
        <p className="text-slate-600 mt-1">Chronological record of all system alerts / سجل زمني لجميع تنبيهات النظام</p>
      </header>

      {/* Placeholder for Alerts Table/List */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Recorded Alerts</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vessel (MMSI)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Alert Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {/* Placeholder Row - Replace with dynamic data from Convex */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" colSpan={5} align="center">
                  No alerts recorded yet.
                </td>
              </tr>
              {/* Example of a populated row:
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">2024-07-30 10:15:00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">123456789</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Restricted Zone Entry
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Entered 'Coastal Buffer Zone'</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">36.123, 3.456</td>
              </tr>
              */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlertsLogPage; 