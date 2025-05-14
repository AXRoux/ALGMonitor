import type { NextApiRequest, NextApiResponse } from "next";
import WebSocket from "ws";

interface Position {
  mmsi: string;
  lat: number;
  lon: number;
  timestamp: number;
}

const { AIS_STREAM_API_KEY, CONVEX_URL, CONVEX_ADMIN_KEY } = process.env;

function missingEnv(...vars: string[]) {
  return vars.filter((v) => !v).length > 0;
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (missingEnv(AIS_STREAM_API_KEY, CONVEX_URL, CONVEX_ADMIN_KEY)) {
    return res.status(500).json({ error: "Missing required environment variables" });
  }

  // 1. If a test MMSI is provided via ?mmsi=, use it; otherwise fetch list from Convex
  const testMmsi = Array.isArray(_req.query.mmsi) ? _req.query.mmsi[0] : _req.query.mmsi;

  let mmsiList: string[] = [];

  if (testMmsi) {
    mmsiList = [String(testMmsi)];
  } else {
    const listResp = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Convex ${CONVEX_ADMIN_KEY}`,
      },
      body: JSON.stringify({
        path: "fisherVessels:listAllVesselsInternal",
        args: {},
        format: "json",
      }),
    });

    const listJson = await listResp.json();
    if (listJson.status !== "success") {
      return res.status(500).json({ error: "Failed to fetch vessel list", details: listJson });
    }
    const registered: { mmsi: string }[] = listJson.value;
    mmsiList = registered.map((v) => v.mmsi);
  }

  if (mmsiList.length === 0) {
    return res.json({ handled: 0, message: "No registered vessels" });
  }

  const trimmedMmsiList = mmsiList.slice(0, 50);
  const endpoint = "wss://stream.aisstream.io/v0/stream";

  const collected: Position[] = [];

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(endpoint);
    const TIME_WINDOW_MS = 120_000;
    const timeout = setTimeout(() => ws.close(), TIME_WINDOW_MS);

    ws.on("open", () => {
      const sub = {
        APIKey: AIS_STREAM_API_KEY,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FiltersShipMMSI: trimmedMmsiList,
        FilterMessageTypes: ["PositionReport"],
      };
      ws.send(JSON.stringify(sub));
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.MessageType !== "PositionReport" || !msg.MetaData) return;
        const { MMSI, Latitude, Longitude, time_utc } = msg.MetaData;
        if (MMSI && Latitude != null && Longitude != null) {
          collected.push({
            mmsi: String(MMSI),
            lat: Number(Latitude),
            lon: Number(Longitude),
            timestamp: time_utc ? Date.parse(time_utc) : Date.now(),
          });
        }
      } catch {
        /* ignore */
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ws.on("close", () => {
      clearTimeout(timeout);
      resolve();
    });
  });

  if (collected.length === 0) {
    return res.json({ handled: 0, message: "No AIS messages captured" });
  }

  // 3. Bulk upsert positions
  const upsertResp = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${CONVEX_ADMIN_KEY}`,
    },
    body: JSON.stringify({
      path: "vesselPositions:bulkUpsertVesselPositions",
      args: { positions: collected },
      format: "json",
    }),
  });

  const upsertJson = await upsertResp.json();
  if (upsertJson.status !== "success") {
    return res.status(500).json({ error: "Failed to upsert positions", details: upsertJson });
  }

  return res.json({ handled: collected.length });
} 