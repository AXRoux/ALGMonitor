import React, { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function ManageFishersPage() {
  const { isAuthenticated } = useConvexAuth();
  // @ts-ignore
  const fishers = useQuery(
    api.fisherProfiles.listFisherProfiles,
    isAuthenticated ? {} : "skip",
  );
  // @ts-ignore
  const updateFisher = useMutation(api.fisherProfiles.updateFisherByAdmin);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const beginEdit = (f: any) => {
    setEditingId(f._id);
    setName(f.name || "");
    setPhone(f.phone || "");
    setAlertsEnabled(f.alertsEnabled !== false); // default true
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setPhone("");
    setAlertsEnabled(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      setSaving(true);
      await updateFisher({
        profileId: editingId as any,
        name,
        phone,
        alertsEnabled,
      });
      cancelEdit();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const renderEditForm = () => (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-700">Edit Fisher</h2>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-slate-600">Name</label>
          <input id="name" type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full rounded border-slate-300 focus:ring-sky-500 focus:border-sky-500" />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-slate-600">Phone</label>
          <input id="phone" type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full rounded border-slate-300 focus:ring-sky-500 focus:border-sky-500" />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input id="alerts" type="checkbox" checked={alertsEnabled} onChange={e=>setAlertsEnabled(e.target.checked)} />
          <label htmlFor="alerts" className="text-sm text-slate-600">Receive Restricted Zone Alerts</label>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded disabled:opacity-50" aria-busy={saving}>Save</button>
        <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded">Cancel</button>
      </div>
    </form>
  );

  return (
    <>
      <SignedOut>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded">Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="space-y-8">
          <h1 className="text-2xl font-bold text-slate-800">Manage Fishers</h1>

          {editingId && renderEditForm()}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Existing Fisher Profiles</h2>
            {fishers?.length ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">MMSI</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Alerts</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {fishers.map((f: any)=> (
                    <tr key={f._id} className="border-t border-slate-200">
                      <td className="py-2 pr-4">{f.name}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{f.mmsi}</td>
                      <td className="py-2 pr-4">{f.phone}</td>
                      <td className="py-2 pr-4">{f.alertsEnabled === false ? 'off' : 'on'}</td>
                      <td className="py-2 pr-4">
                        <button onClick={()=>beginEdit(f)} className="text-sky-600 hover:underline text-sm">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 text-sm">No fisher profiles found.</p>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
} 