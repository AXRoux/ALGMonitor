import { ConvexError, v } from "convex/values";
import { action, internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Main action to be called by a cron job to ingest AIS data.
export const ingestAisDataFromApi = action({
  args: {},
  // This action is kept for backward compatibility but is now disabled because
  // Convex actions cannot open WebSocket connections. Ingestion is performed
  // by the Next.js API route `pages/api/ingest-ais.ts` instead.
  handler: async () => {
    console.log("ingestAisDataFromApi is disabled. Use /api/ingest-ais route.");
    return "Disabled - moved to Next.js API route.";
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

    // Call Twilio Messages API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    const body = new URLSearchParams({
      From: twilioPhoneNumber,
      To: phoneNumber,
      Body: messageBody,
    });

    const authHeader = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");

    const resp = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Twilio SMS send failed:", txt);
      throw new ConvexError(`Twilio SMS failed: ${resp.status} ${resp.statusText}`);
    }

    console.log(`SMS alert sent to ${phoneNumber} for zone ${zoneName}.`);
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

// Remove the generateMockAisData action (development-only) to satisfy type checker.
// ... existing code ends before this removed block ... 