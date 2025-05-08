import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export default function ManageZonesPage() {
  const zones = useQuery(api.restrictedZones.listRestrictedZones, {});
  const addZone = useMutation(api.restrictedZones.addRestrictedZoneByAdmin);
  const updateZone = useMutation(api.restrictedZones.updateRestrictedZoneByAdmin);

  // Log the Mapbox token to verify its presence on the client-side
  // console.log('Mapbox Token (Admin Zones):', process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState(''); // expects stringified array [[[lon,lat]...]]
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinateError, setCoordinateError] = useState<string | null>(null); // New state for coordinate parsing error

  // Validate coordinates whenever they change
  useEffect(() => {
    if (!coordinates.trim()) {
      setCoordinateError(null);
      return;
    }
    try {
      const parsed = JSON.parse(coordinates);
      if (!Array.isArray(parsed)) {
        setCoordinateError('Coordinates must be a GeoJSON array, e.g., [[[lon,lat],...]].');
        return;
      }
      // Basic validation for polygon structure (array of arrays of [lon, lat] number pairs)
      const isValid = parsed.every((ring: any) =>
        Array.isArray(ring) &&
        ring.every((point: any) =>
          Array.isArray(point) &&
          point.length === 2 &&
          typeof point[0] === 'number' &&
          typeof point[1] === 'number'
        )
      );
      if (!isValid) {
        setCoordinateError('Invalid polygon structure. Ensure it is an array of rings, where each ring is an array of [lon, lat] number pairs.');
        return;
      }
      setCoordinateError(null);
    } catch (e) {
      setCoordinateError('Invalid GeoJSON format.');
    }
  }, [coordinates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCoordinateError(null); // Clear coordinate error on submit
    setSubmitting(true);
    try {
      if (editingZoneId) {
        await updateZone({ zoneId: editingZoneId as any, name, description, geoJsonCoordinates: coordinates });
      } else {
        await addZone({ name, description, geoJsonCoordinates: coordinates });
      }
      setName('');
      setDescription('');
      setCoordinates('');
      setEditingZoneId(null);
      setCoordinateError(null); // Clear coordinate error on successful submit
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add zone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditZone = (z: any) => {
    setEditingZoneId(z._id);
    setName(z.name || '');
    setDescription(z.description || '');
    setCoordinates(z.geoJsonCoordinates || '');
    setError(null);
    setCoordinateError(null);
  };

  const handleCancelEdit = () => {
    setEditingZoneId(null);
    setName('');
    setDescription('');
    setCoordinates('');
    setError(null);
    setCoordinateError(null);
  };

  return (
    <>
      <SignedOut>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Authentication Required</h2>
          <p className="mb-4 text-slate-600">Please sign in with an administrator account to manage restricted zones.</p>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded">Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="space-y-8">
          <h1 className="text-2xl font-bold text-slate-800">Manage Restricted Zones</h1>

          {/* Add Zone Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-700">{editingZoneId ? 'Edit Zone' : 'Add New Zone'}</h2>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600" htmlFor="name">Name</label>
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded border-slate-300 focus:ring-sky-500 focus:border-sky-500" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600" htmlFor="description">Description</label>
                <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded border-slate-300 focus:ring-sky-500 focus:border-sky-500" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-slate-600" htmlFor="coords">Polygon Coordinates (GeoJSON array)</label>
                <textarea id="coords" value={coordinates} onChange={e => {
                  setCoordinates(e.target.value);
                  if (coordinateError) setCoordinateError(null); // Clear error on input change
                }} rows={4} required className="w-full rounded border-slate-300 focus:ring-sky-500 focus:border-sky-500 text-xs"></textarea>
                <p className="text-xs text-slate-500">Example: [[[3.0,36.7],[3.5,36.7],[3.5,37.0],[3.0,37.0],[3.0,36.7]]]</p>
                {coordinateError && <p className="text-xs text-red-500 mt-1">{coordinateError}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={submitting || !!coordinateError} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded disabled:opacity-50" aria-busy={submitting}>{editingZoneId ? 'Save Changes' : 'Add Zone'}</button>
              {editingZoneId && (
                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded">Cancel</button>
              )}
            </div>
          </form>

          {/* Existing Zones List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Existing Zones</h2>
            {zones?.length ? (
              <ul className="divide-y divide-slate-200">
                {zones.map((z: any) => (
                  <li key={z._id} className="py-2 flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-medium">{z.name}</span>
                      <span className="text-xs text-slate-500">{z.description}</span>
                    </div>
                    <button onClick={() => handleEditZone(z)} className="text-sm text-sky-600 hover:underline">Edit</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">No zones found.</p>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
} 