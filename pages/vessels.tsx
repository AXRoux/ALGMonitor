import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { PhoneIcon, PlusIcon, PencilIcon, TrashIcon, InformationCircleIcon, ExclamationCircleIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";

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
  const [showForm, setShowForm] = useState(false);

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
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setVesselName("");
    setMmsi("");
    setError(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vesselName || !mmsi) {
      setError("Vessel name and MMSI are required");
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
    if (!confirm("Are you sure you want to delete this vessel?")) return;
    try {
      await removeVessel({ vesselId: id });
    } catch (err: any) {
      alert(err?.message ?? "Delete failed");
    }
  };

  const handleSavePhone = async () => {
    if (!phone) {
      alert("Phone number is required for receiving alerts");
      return;
    }
    try {
      setSavingProfile(true);
      await saveProfile({ phone });
      alert("Phone number updated successfully");
    } catch (err: any) {
      alert(err?.message ?? "Failed to update phone number");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <>
      <SignedOut>
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-auto mt-12">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-slate-600 mb-6">Please sign in to manage your vessels</p>
          <SignInButton mode="modal">
            <button className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors shadow-sm">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="border-b border-slate-200 pb-5">
            <h1 className="text-3xl font-bold text-slate-800">My Vessels</h1>
            <p className="text-slate-500 mt-2">
              Register and manage your vessels for monitoring and alert services
            </p>
          </div>

          {/* Phone section */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <PhoneIcon className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-semibold text-slate-700">Alert Contact</h2>
            </div>
            <p className="text-slate-500 text-sm mb-4">
              We will send SMS alerts to this number when any of your vessels enter a restricted zone.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500 sm:text-sm">+</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number with country code"
                  className="block w-full pl-7 pr-12 py-2 border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <button
                onClick={handleSavePhone}
                disabled={savingProfile}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {savingProfile ? "Saving..." : "Update Phone"}
              </button>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-700">
              My Vessel List ({vessels && vessels !== "skip" ? vessels.length : 0})
            </h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors shadow-sm"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Vessel</span>
              </button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <ArchiveBoxIcon className="h-5 w-5 text-sky-600" />
                  <h2 className="text-lg font-semibold text-slate-700">
                    {editingId ? "Edit Vessel" : "Add New Vessel"}
                  </h2>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex items-center">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="vesselName" className="block text-sm font-medium text-slate-700">
                      Vessel Name
                    </label>
                    <input
                      id="vesselName"
                      type="text"
                      value={vesselName}
                      onChange={(e) => setVesselName(e.target.value)}
                      className="w-full rounded-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 shadow-sm"
                      placeholder="Enter vessel name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="mmsi" className="block text-sm font-medium text-slate-700">
                      MMSI Number
                      <span className="ml-1 inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                        Required
                      </span>
                    </label>
                    <input
                      id="mmsi"
                      type="text"
                      value={mmsi}
                      onChange={(e) => setMmsi(e.target.value)}
                      className="w-full rounded-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 shadow-sm"
                      placeholder="e.g. 123456789"
                    />
                    <p className="text-xs text-slate-500">
                      <InformationCircleIcon className="h-3 w-3 inline mr-1" />
                      The MMSI is a 9-digit number used for vessel identification
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Vessel"
                      : "Add Vessel"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Vessels List */}
          <div className="space-y-4">
            {vessels && vessels !== "skip" && vessels.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vessels.map((v: any) => (
                  <div
                    key={v._id}
                    className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">{v.vesselName}</h3>
                          <p className="text-sm font-mono mt-1 text-slate-500">MMSI: {v.mmsi}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => beginEdit(v)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(v._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center border border-slate-100">
                <ArchiveBoxIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">No vessels registered</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Register your vessels to enable monitoring and receive alerts when they enter restricted zones.
                </p>
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors shadow-sm inline-flex items-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add Your First Vessel</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
} 