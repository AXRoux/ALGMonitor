import dynamic from 'next/dynamic';
import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { LayerProps } from 'react-map-gl';

// Dynamically import react-map-gl (v6) components to bypass SSR issues
const MapGL: any = dynamic(() => import('react-map-gl').then((m: any) => m.default), { ssr: false });
const Marker: any = dynamic(() => import('react-map-gl').then((m: any) => m.Marker), { ssr: false });
const Source: any = dynamic(() => import('react-map-gl').then((m: any) => m.Source), { ssr: false });
const Layer: any = dynamic(() => import('react-map-gl').then((m: any) => m.Layer), { ssr: false });

const vesselIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-3 h-3 text-emerald-500"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 2l9 4-9 4-9-4 9-4zm0 9l9 4-9 4-9-4 9-4zm0 9l9 4-9 4-9-4 9-4z" />
  </svg>
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

export default function LiveMap() {
  const isClient = typeof window !== 'undefined';

  const zones = useQuery(
    api.restrictedZones.listRestrictedZones,
    isClient ? {} : 'skip'
  );
  const positions = useQuery(
    api.vesselPositions.listRecentPositions,
    isClient ? {} : 'skip'
  );

  // Remote restricted zone GeoJSON fetched from Marine Regions (Algeria EEZ)
  const [remoteZones, setRemoteZones] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    // Fetch Algerian EEZ polygon via Marine Regions WFS (iso_ter1 = DZA)
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
        // Network or CORS error – ignore silently
      }
    };
    fetchRemote();
    return () => controller.abort();
  }, []);

  if (!isClient) return null; // render nothing during SSR

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

  // Merge database zones with remote zones
  const combinedZones: GeoJSON.FeatureCollection | undefined = useMemo(() => {
    const features: GeoJSON.Feature[] = [];

    if (geoJson?.features) {
      features.push(...geoJson.features);
    }

    if (remoteZones?.features) {
      features.push(...remoteZones.features);
    }

    if (features.length === 0) return undefined;

    return { type: 'FeatureCollection', features };
  }, [geoJson, remoteZones]);

  // Viewport state for react-map-gl v6 interactivity
  const [viewport, setViewport] = useState({ longitude: 3, latitude: 36.7, zoom: 6 });

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

  return (
    <MapGL
      {...viewport}
      onViewportChange={setViewport}
      mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      width="100%"
      height="600px"
      style={{ borderRadius: '0.5rem' }}
    >
      {combinedZones && (
        <Source id="zones" type="geojson" data={combinedZones}>
          <Layer {...zoneFillLayer} />
          <Layer {...zoneOutlineLayer} />
        </Source>
      )}

      {positions?.map((p: any) => (
        <Marker key={p.mmsi} longitude={p.lon} latitude={p.lat} offsetLeft={-5} offsetTop={-5}>
          {vesselIcon}
        </Marker>
      ))}
    </MapGL>
  );
} 