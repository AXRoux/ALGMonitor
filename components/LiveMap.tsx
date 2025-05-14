import dynamic from 'next/dynamic';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import type { LayerProps } from 'react-map-gl';

// Dynamically import react-map-gl components to bypass SSR issues
const MapGL: any = dynamic(() => import('react-map-gl').then((m: any) => m.default), { ssr: false });
const Marker: any = dynamic(() => import('react-map-gl').then((m: any) => m.Marker), { ssr: false });
const Source: any = dynamic(() => import('react-map-gl').then((m: any) => m.Source), { ssr: false });
const Layer: any = dynamic(() => import('react-map-gl').then((m: any) => m.Layer), { ssr: false });
const Popup: any = dynamic(() => import('react-map-gl').then((m: any) => m.Popup), { ssr: false });

// Updated vessel icon with better visibility
const vesselIcon = (isRegistered = true) => (
  <div className={`rounded-full p-1 ${isRegistered ? 'bg-emerald-500' : 'bg-slate-400'}`}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 text-white"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2l9 4-9 4-9-4 9-4zm0 9l9 4-9 4-9-4 9-4zm0 9l9 4-9 4-9-4 9-4z" />
    </svg>
  </div>
);

const zoneFillLayer: LayerProps = {
  id: 'restricted-zones-fill',
  type: 'fill',
  paint: {
    'fill-color': '#f87171',
    'fill-opacity': 0.3,
  },
};

const zoneOutlineLayer: LayerProps = {
  id: 'restricted-zones-outline',
  type: 'line',
  paint: {
    'line-color': '#b91c1c',
    'line-width': 3,
  },
};

const VESSEL_NAMES = [
  'El Kala',
  'Sahara Breeze',
  'Oran Star',
  'Algiers Pearl',
  'Mediterranean Spirit',
];

const MAX_ATTEMPTS = 20000; // limit for random sampling loops

// Additional constraints for new vessels
const HIGH_LAT_THRESHOLD = 37.4; // Ensures extra vessels appear farther north ("above" the first two)
const MIN_VESSEL_SEPARATION = 0.1; // ~10-12 km separation to avoid crowding

// Helper to clamp value between min / max
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// Helper to generate a unique random MMSI (9-digit) not already used
const generateUniqueMmsi = (taken: Set<number>): number => {
  let candidate = 0;
  while (candidate === 0 || taken.has(candidate)) {
    candidate = 100000000 + Math.floor(Math.random() * 900000000);
  }
  taken.add(candidate);
  return candidate;
};

// Helper to ensure sufficient distance from existing vessels
const isFarFromOthers = (
  lon: number,
  lat: number,
  others: { lat: number; lon: number }[],
  min = MIN_VESSEL_SEPARATION,
): boolean => {
  return others.every((o) => {
    const dLat = lat - o.lat;
    const dLon = lon - o.lon;
    return Math.sqrt(dLat * dLat + dLon * dLon) >= min;
  });
};

export default function LiveMap() {
  const isClient = typeof window !== 'undefined';
  const { user, isSignedIn } = useUser();
  
  // Get the user's role to determine filtering behavior
  const userRole = useQuery(
    api.users.getMyUserRole,
    isClient && isSignedIn ? {} : 'skip'
  );
  
  // Get the user's vessels if they are a fisher
  const myVessels = useQuery(
    api.fisherVessels.listMyVessels,
    isClient && isSignedIn && userRole === 'fisher' ? {} : 'skip'
  );
  
  // UI state for optional filtering & popup handling
  const [filterMyVesselsOnly, setFilterMyVesselsOnly] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  
  // ---------------------------------------------------------------------
  //  MOCK AIS DATA GENERATION & ANIMATION
  // ---------------------------------------------------------------------

  // Type for mock vessel position
  type MockVesselPosition = {
    mmsi: number;
    vesselName: string;
    lat: number;
    lon: number;
    isRegistered: boolean;
    isMoving: boolean; // indicates if the vessel should randomly move
    timestamp: number;
  };

  // Restrict latitude so that all generated points lie north of the coastline
  const BOUNDS = {
    minLat: 36.7, // roughly coastline latitude – keeps vessels in the Mediterranean
    maxLat: 38.0,
    minLon: -1.5,
    maxLon: 9.5,
  };

  // Desired number of simulated vessels (now five)
  const FLEET_SIZE = 5;

  // ---------------------------------------------------------------------
  //  Remote Algerian EEZ (for sea-only bounds)
  // ---------------------------------------------------------------------

  const [remoteZones, setRemoteZones] = useState<GeoJSON.FeatureCollection | null>(null);

  // Fetch Algerian EEZ polygon once on mount (via Marine Regions WFS)
  useEffect(() => {
    const controller = new AbortController();
    const fetchRemote = async () => {
      try {
        const raw =
          'https://geo.vliz.be/geoserver/MarineRegions/wfs?service=WFS&' +
          'version=1.0.0&request=GetFeature&typename=eez&' +
          "CQL_FILTER=" + encodeURIComponent("iso_ter1 = 'DZA'") +
          '&outputFormat=application/json';
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(raw)}`;
        const res = await fetch(proxyUrl, { signal: controller.signal });
        if (!res.ok) return;
        const json = (await res.json()) as GeoJSON.FeatureCollection;
        setRemoteZones(json);
      } catch (_) {
        // Ignore network / CORS errors silently
      }
    };
    fetchRemote();
    return () => controller.abort();
  }, []);

  // Utility: Ray-casting algorithm for point-in-polygon testing
  const pointInRing = (pt: [number, number], ring: number[][]): boolean => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
        pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const isPointInsideRemoteZones = (lon: number, lat: number): boolean => {
    if (!remoteZones || !remoteZones.features || remoteZones.features.length === 0) {
      return true; // treat as valid if EEZ unavailable
    }

    for (const feature of remoteZones.features) {
      const geom = feature.geometry;
      if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) continue;

      if (geom.type === 'Polygon') {
        const ring = (geom as GeoJSON.Polygon).coordinates[0];
        if (ring && ring.length >= 3 && pointInRing([lon, lat], ring as number[][])) return true;
      } else {
        for (const poly of (geom as GeoJSON.MultiPolygon).coordinates) {
          const ring = poly[0];
          if (ring && ring.length >= 3 && pointInRing([lon, lat], ring as number[][])) return true;
        }
      }
    }
    return false;
  };

  // Generate initial vessels once remoteZones are available
  const [mockPositions, setMockPositions] = useState<MockVesselPosition[]>([]);

  useEffect(() => {
    if (mockPositions.length > 0) return;

    const newVessels: MockVesselPosition[] = [];
    const takenMmsi = new Set<number>();
    let attempts = 0;

    while (newVessels.length < FLEET_SIZE && attempts < MAX_ATTEMPTS) {
      const candidateIdx = newVessels.length;
      const lon = BOUNDS.minLon + Math.random() * (BOUNDS.maxLon - BOUNDS.minLon);
      const lat = BOUNDS.minLat + Math.random() * (BOUNDS.maxLat - BOUNDS.minLat);

      // Ensure the three additional vessels spawn farther north
      if (candidateIdx >= 2 && lat < HIGH_LAT_THRESHOLD) {
        attempts++;
        continue;
      }

      if (
        isPointInsideRemoteZones(lon, lat) &&
        isFarFromOthers(lon, lat, newVessels)
      ) {
        const mmsi = generateUniqueMmsi(takenMmsi);
        const name = VESSEL_NAMES[candidateIdx % VESSEL_NAMES.length];

        newVessels.push({
          mmsi,
          vesselName: name,
          lat,
          lon,
          isRegistered: Math.random() < 0.7,
          isMoving: Math.random() < 0.5,
          timestamp: Date.now(),
        });
      }
      attempts++;
    }
    setMockPositions(newVessels);
  }, []);

  // Animate moving vessels every 2 seconds with a subtle random walk
  useEffect(() => {
    const intervalId = setInterval(() => {
      setMockPositions((prev) =>
        prev.map((v) => {
          if (!v.isMoving) return v; // keep static vessels unchanged

          const deltaLat = (Math.random() - 0.5) * 0.04; // ±0.02 degrees ~2 km
          const deltaLon = (Math.random() - 0.5) * 0.04;

          const newLat = clamp(v.lat + deltaLat, BOUNDS.minLat, BOUNDS.maxLat);
          const newLon = clamp(v.lon + deltaLon, BOUNDS.minLon, BOUNDS.maxLon);

          // Only apply move if still inside water (remoteZones)
          if (isPointInsideRemoteZones(newLon, newLat)) {
            return { ...v, lat: newLat, lon: newLon, timestamp: Date.now() };
          }
          return v; // otherwise remain
        })
      );
    }, 2000); // update every 2 seconds

    return () => clearInterval(intervalId);
  }, []);

  // ---------------------------------------------------------------------
  //  Ensure all vessels lie within EEZ once remoteZones is available
  // ---------------------------------------------------------------------

  useEffect(() => {
    if (!remoteZones || !remoteZones.features) return;

    setMockPositions((prev) => {
      const inSea = prev.filter((v) => isPointInsideRemoteZones(v.lon, v.lat));

      const takenMmsi = new Set<number>(inSea.map((v) => v.mmsi));
      let attempts = 0;
      const result: MockVesselPosition[] = [...inSea];

      while (result.length < FLEET_SIZE && attempts < MAX_ATTEMPTS) {
        const candidateIdx = result.length;
        const lon = BOUNDS.minLon + Math.random() * (BOUNDS.maxLon - BOUNDS.minLon);
        const lat = BOUNDS.minLat + Math.random() * (BOUNDS.maxLat - BOUNDS.minLat);

        // Keep extra vessels to the north
        if (candidateIdx >= 2 && lat < HIGH_LAT_THRESHOLD) {
          attempts++;
          continue;
        }

        if (
          isPointInsideRemoteZones(lon, lat) &&
          isFarFromOthers(lon, lat, result)
        ) {
          const mmsi = generateUniqueMmsi(takenMmsi);
          const name = VESSEL_NAMES[candidateIdx % VESSEL_NAMES.length];
          result.push({
            mmsi,
            vesselName: name,
            lat,
            lon,
            isRegistered: Math.random() < 0.7,
            isMoving: Math.random() < 0.5,
            timestamp: Date.now(),
          });
        }
        attempts++;
      }

      return result;
    });
  }, [remoteZones]);

  // ---------------------------------------------------------------------
  //  Nudge specific vessel (Sahara Breeze) farther north if still too close
  // ---------------------------------------------------------------------

  useEffect(() => {
    setMockPositions((prev) =>
      prev.map((v) => {
        if (v.vesselName === 'Sahara Breeze' && v.lat < 37.2) {
          return { ...v, lat: 37.2 };
        }
        return v;
      })
    );
  }, [mockPositions]);

  // ---------------------------------------------------------------------
  //  END OF REMOVED REAL AIS FETCH LOGIC
  // ---------------------------------------------------------------------

  // Convex API queries – we keep restricted zones & user info but stop fetching real AIS positions  
  const zones = useQuery(
    api.restrictedZones.listRestrictedZones,
    isClient ? {} : 'skip'
  );

  // Use local mock positions instead of server state
  const positions = mockPositions;

  // Local DB restricted zones GeoJSON
  const geoJson = useMemo(() => {
    if (!zones) return undefined;
    return {
      type: 'FeatureCollection',
      features: zones.map((z: any) => ({
        type: 'Feature',
        properties: { name: z.name },
        geometry: {
          type: 'Polygon',
          coordinates: JSON.parse(z.geoJsonCoordinates),
        },
      })),
    } as GeoJSON.FeatureCollection;
  }, [zones]);

  // Combined zones (DB + EEZ)
  const combinedZones: GeoJSON.FeatureCollection | undefined = useMemo(() => {
    const features: GeoJSON.Feature[] = [];
    if (geoJson?.features) features.push(...geoJson.features);
    if (remoteZones?.features) features.push(...remoteZones.features);
    if (features.length === 0) return undefined;
    return { type: 'FeatureCollection', features };
  }, [geoJson, remoteZones]);

  // Filter positions based on user role and preferences
  const filteredPositions = useMemo(() => {
    if (!positions) return [];
    
    // If not filtering or admin, show all vessels
    if (!filterMyVesselsOnly || userRole === 'admin') {
      return positions;
    }
    
    // If fisher wants to see only their vessels
    if (myVessels && Array.isArray(myVessels)) {
      const myMmsiList = myVessels.map((v: any) => Number(v.mmsi));
      return positions.filter((p: any) => myMmsiList.includes(Number(p.mmsi)));
    }
    
    return positions;
  }, [positions, myVessels, filterMyVesselsOnly, userRole]);

  // Viewport state for react-map-gl
  const [viewport, setViewport] = useState({ longitude: 3, latitude: 36.7, zoom: 6 });

  // Ref to access underlying mapbox-gl Map instance
  const mapRef = useRef<any>(null);

  // Increase zoom speed when map first loads
  const handleMapLoad = () => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    try {
      map.scrollZoom?.setWheelZoomRate?.(1 / 120);
      map.scrollZoom?.setZoomRate?.(1);
    } catch (_) {
      // Ignore if API differs between mapbox versions
    }
  };

  // Fit map to combined zone bounds when they first load
  useEffect(() => {
    if (!combinedZones || combinedZones.features.length === 0) return;
    // Calculate bounding box
    const coords: number[][] = [];
    combinedZones.features.forEach((f) => {
      const geom = f.geometry;
      if (geom.type === 'Polygon') {
        coords.push(...(geom.coordinates[0] as number[][]));
      }
      if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach((poly) => coords.push(...(poly[0] as number[][])));
      }
    });
    if (coords.length === 0) return;
    const lons = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const newLon = (minLon + maxLon) / 2;
    const newLat = (minLat + maxLat) / 2;
    const lonDelta = maxLon - minLon;
    const latDelta = maxLat - minLat;
    // Rough zoom estimation for WebMercator
    const maxDelta = Math.max(lonDelta, latDelta);
    const newZoom = Math.max(3, 8 - Math.log2(maxDelta));
    setViewport((v) => ({ ...v, longitude: newLon, latitude: newLat, zoom: newZoom }));
  }, [combinedZones]);

  // Handler for vessel marker clicks
  const handleVesselClick = (vessel: any) => {
    setSelectedVessel(vessel);
  };

  return (
    <div className="space-y-4">
      {/* Map controls */}
      {userRole === 'fisher' && (
        <div className="bg-white rounded-lg shadow-sm p-2 flex items-center space-x-2">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-sky-600 rounded"
              checked={filterMyVesselsOnly}
              onChange={(e) => setFilterMyVesselsOnly(e.target.checked)}
            />
            <span className="ml-2 text-sm text-slate-700">Show only my vessels</span>
          </label>
          
          <div className="flex-grow"></div>
          
          {/* Refresh controls removed since data is now generated locally */}
        </div>
      )}
      
      {/* Map container */}
      <div className="relative rounded-lg overflow-hidden shadow-lg">
        <MapGL
          ref={mapRef}
          {...viewport}
          onViewportChange={setViewport}
          mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          width="100%"
          height="600px"
          onLoad={handleMapLoad}
        >
          {combinedZones && (
            <Source id="zones" type="geojson" data={combinedZones}>
              <Layer {...zoneFillLayer} />
              <Layer {...zoneOutlineLayer} />
            </Source>
          )}

          {filteredPositions?.map((p: any) => (
            <Marker 
              key={p.mmsi} 
              longitude={p.lon} 
              latitude={p.lat} 
              offsetLeft={-12} 
              offsetTop={-12}
              onClick={() => handleVesselClick(p)}
            >
              {vesselIcon(p.isRegistered)}
            </Marker>
          ))}
          
          {selectedVessel && (
            <Popup
              longitude={selectedVessel.lon}
              latitude={selectedVessel.lat}
              closeButton={true}
              closeOnClick={false}
              onClose={() => setSelectedVessel(null)}
              anchor="bottom"
              className="vessel-popup-custom"
            >
              <div className="p-2">
                <h3 className="font-semibold text-sm">{selectedVessel.vesselName}</h3>
                <p className="text-xs text-slate-500">MMSI: {selectedVessel.mmsi}</p>
                <p className="text-xs text-slate-500">
                  {new Date(selectedVessel.timestamp).toLocaleTimeString()}
                </p>
                <p className="text-xs font-mono">
                  {selectedVessel.lat.toFixed(5)}, {selectedVessel.lon.toFixed(5)}
                </p>
              </div>
            </Popup>
          )}
        </MapGL>
        
        <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-slate-500">
          <p>Auto-updating: Real-time (local simulation)</p>
          <p>Vessels shown: {filteredPositions?.length || 0}</p>
        </div>
      </div>
    </div>
  );
} 