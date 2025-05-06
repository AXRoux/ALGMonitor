import { ConvexError, v } from "convex/values";
import { action, internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Main action to be called by a cron job to ingest AIS data.
export const ingestAisDataFromApi = action({
  args: {},
  handler: async (ctx) => {
    console.log("Starting AIS data ingestion...");
    const aisApiKey = process.env.AIS_STREAM_API_KEY;

    if (!aisApiKey) {
      console.error("AIS_STREAM_API_KEY is not set in Convex environment variables.");
      throw new ConvexError("AIS API key is not configured.");
    }

    // 1. Fetch data from AIS Stream API (Implementation to be added)
    // Example structure for fetched data: [{ mmsi: string, lat: number, lon: number, timestamp: number, ... }]
    let fetchedVesselData: any[] = []; 
    // --- ADD AIS API FETCH LOGIC HERE ---
    // E.g., using fetch() to call the AIS provider's HTTP API endpoint.
    // Remember to handle potential errors from the API call.

    if (fetchedVesselData.length === 0) {
      console.log("No new vessel data fetched.");
      return "No new data";
    }

    // 2. Process each fetched vessel data point
    for (const vessel of fetchedVesselData) {
      // Basic validation of essential fields
      if (!vessel.mmsi || vessel.lat == null || vessel.lon == null || vessel.timestamp == null) {
        console.warn("Skipping vessel data due to missing fields:", vessel);
        continue;
      }

      // Upsert the position into our database
      await ctx.runMutation(internal.vesselPositions.upsertVesselPosition, {
        mmsi: String(vessel.mmsi),
        lat: Number(vessel.lat),
        lon: Number(vessel.lon),
        timestamp: Number(vessel.timestamp),
      });

      // Trigger alert check for this vessel
      await ctx.runAction(internal.aisActions.checkForAlerts, { 
        mmsi: String(vessel.mmsi),
        lat: Number(vessel.lat),
        lon: Number(vessel.lon),
      });
    }

    console.log(`Processed ${fetchedVesselData.length} vessel updates.`);
    return `Processed ${fetchedVesselData.length} updates.`;
  },
});

// Internal action to check for alerts for a specific vessel position.
export const checkForAlerts = internalAction({
  args: {
    mmsi: v.string(),
    lat: v.float64(),
    lon: v.float64(),
  },
  handler: async (ctx, { mmsi, lat, lon }) => {
    // 1. Fetch all restricted zones
    const restrictedZones = await ctx.runQuery(api.restrictedZones.listRestrictedZones, {});
    if (!restrictedZones || restrictedZones.length === 0) {
      return; // No zones to check against
    }

    let isInRestrictedZone = false;
    let violatedZoneName = "";

    // 2. Point-in-polygon check for each zone (Implementation to be added)
    for (const zone of restrictedZones) {
      // --- ADD POINT-IN-POLYGON LOGIC HERE ---
      // This will involve parsing zone.geoJsonCoordinates and using a geometry library
      // or algorithm to check if {lat, lon} is inside the polygon.
      // If true: set isInRestrictedZone = true; violatedZoneName = zone.name; break;
    }

    if (isInRestrictedZone) {
      // 3. If in a restricted zone, fetch fisher profile and trigger alert
      const fisherProfile = await ctx.runQuery(internal.fisherProfiles.getFisherProfileByMmsiInternal, { mmsi });

      if (fisherProfile && fisherProfile.phone) {
        await ctx.runAction(internal.aisActions.sendRestrictedZoneSmsAlert, {
          fisherName: fisherProfile.name,
          phoneNumber: fisherProfile.phone,
          zoneName: violatedZoneName,
          lat: lat,
          lon: lon,
        });
        // Log the alert
        await ctx.runMutation(internal.aisActions.logAlertToDb, {
          fisherProfileId: fisherProfile._id,
          lat: lat,
          lon: lon,
          alertType: "restricted_zone_entry",
          details: `Entered restricted zone: ${violatedZoneName}`,
        });
      } else {
        console.warn(`Fisher profile or phone not found for MMSI ${mmsi} during alert check.`);
      }
    }
  },
});

// Internal action to send SMS alert via Twilio.
export const sendRestrictedZoneSmsAlert = internalAction({
  args: {
    fisherName: v.string(),
    phoneNumber: v.string(),
    zoneName: v.string(),
    lat: v.float64(),
    lon: v.float64(),
  },
  handler: async (ctx, { fisherName, phoneNumber, zoneName, lat, lon }) => {
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("Twilio environment variables are not fully set.");
      throw new ConvexError("Twilio configuration is incomplete.");
    }

    const messageBody = `Hello ${fisherName}, your vessel has entered the restricted zone: ${zoneName} at coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)}). Please take appropriate action. - Algerian Maritime Monitor`;

    // --- ADD TWILIO API CALL LOGIC HERE ---
    // Example: using fetch() to call Twilio's Messages API.
    // const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    // const response = await fetch(twilioUrl, { ... });
    // Handle response and errors.

    console.log(`SMS alert supposedly sent to ${phoneNumber} for zone ${zoneName}.`);
    return true;
  },
});

// Internal mutation to log an alert to the alertLogs table.
export const logAlertToDb = internalMutation({
  args: {
    fisherProfileId: v.id("fisherProfiles"),
    lat: v.float64(),
    lon: v.float64(),
    // Match the schema definition for alertType
    alertType: v.union(
      v.literal("restricted_zone_entry"), 
      v.literal("communication_test"),
      v.literal("sos")
    ),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { fisherProfileId, lat, lon, alertType, details }) => {
    await ctx.db.insert("alertLogs", {
      fisherProfileId,
      lat,
      lon,
      timestamp: Date.now(),
      alertType, // This will now be correctly typed
      details,
    });
    return true;
  },
});

// We will need a query in fisherProfiles.ts like getFisherProfileByMmsiInternal
// For now, this file depends on its future existence. 