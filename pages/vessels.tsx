import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function MyVesselsPage() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.fisherProfiles.getMyFisherProfile as any,
    isAuthenticated ? {} : "skip"
  ) as any | "skip" | undefined;

  const vessels = useQuery(
    api.fisherVessels.listMyVessels as any,
    isAuthenticated ? {} : "skip"
  ) as any[] | "skip" | undefined;
  const addVessel = useMutation(api.fisherVessels.addVessel as any);
  const updateVessel = useMutation(api.fisherVessels.updateVessel as any);
  const removeVessel = useMutation(api.fisherVessels.removeVessel as any);
  const saveProfile = useMutation(api.fisherProfiles.updateMyFisherProfile as any);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [vesselName, setVesselName] = useState("");
  const [mmsi, setMmsi] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && profile !== "skip") {
      setPhone(profile?.phone ?? "");
    }
  }, [profile]);

  const beginEdit = (v: any) => {
    setEditingId(v._id);
    setVesselName(v.vesselName);
    setMmsi(v.mmsi);
    setError(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setVesselName("");
    setMmsi("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vesselName || !mmsi) {
      setError("Name and MMSI required");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await updateVessel({ vesselId: editingId, vesselName, mmsi });
      } else {
        await addVessel({ vesselName, mmsi });
      }
      resetForm();
    } catch (err: any) {
      setError(err?.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vessel?")) return;
    try {
      await removeVessel({ vesselId: id });
    } catch (err: any) {
      alert(err?.message ?? "Delete failed");
    }
  };

  const handleSavePhone = async () => {
    if (!phone) {
      alert("Phone is required");
      return;
    }
    try {
      setSavingProfile(true);
      await saveProfile({ phone });
      alert("Phone updated");
    } catch (err: any) {
      alert(err?.message ?? "Failed");
    } finally {
      setSavingProfile(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-800">My Vessels</h1>

          {/* Phone section */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-700">Alert Phone Number</h2>
            <p className="text-slate-500 text-sm">We will send SMS alerts to this number when any of your vessels enter a restricted zone.</p>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full md:max-w-xs rounded border-slate-300 focus:ring-sky-500 focus:border-sky-500"
              />
              <button
                onClick={handleSavePhone}
                disabled={savingProfile}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-700">
              {editingId ? "Edit Vessel" : "Add Vessel"}
            </h2>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="vesselName"
                  className="block text-sm font-medium text-slate-600"
                >
                  Vessel Name
                </label>
                <input
                  id="vesselName"
                  type="text"
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  className="w-full rounded border-slate-300 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="mmsi"
                  className="block text-sm font-medium text-slate-600"
                >
                  MMSI
                </label>
                <input
                  id="mmsi"
                  type="text"
                  value={mmsi}
                  onChange={(e) => setMmsi(e.target.value)}
                  className="w-full rounded border-slate-300 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded disabled:opacity-50"
              >
                {editingId ? "Save" : "Add"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              My Vessel List
            </h2>
            {vessels && vessels !== "skip" && vessels.length ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">MMSI</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {vessels.map((v: any) => (
                    <tr key={v._id} className="border-t border-slate-200">
                      <td className="py-2 pr-4">{v.vesselName}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{v.mmsi}</td>
                      <td className="py-2 pr-4 flex gap-2">
                        <button
                          className="text-sky-600 hover:underline text-sm"
                          onClick={() => beginEdit(v)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:underline text-sm"
                          onClick={() => handleDelete(v._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 text-sm">No vessels yet.</p>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
} 