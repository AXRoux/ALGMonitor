import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Schedule the AIS data ingestion action to run periodically.
// Adjust the interval as needed based on AIS API rate limits and desired data freshness.
// Example: Run every 5 minutes.
crons.interval(
  "Fetch AIS Data Regularly",
  { minutes: 5 }, // Interval: e.g., { minutes: 5 }, { hours: 1 }, { cronString: "0 * * * *" } for every hour
  api.aisActions.ingestAisDataFromApi, // Reference to the public action
  {} // Arguments to the action, if any (ingestAisDataFromApi takes no args)
);

// You can add more cron jobs here if needed.
// For example:
// crons.daily(
//   "Daily Cleanup Job",
//   { hourUTC: 8, minuteUTC: 0 }, // Run at 8:00 AM UTC
//   internal.someOtherModule.cleanupOldData,
//   { olderThanDays: 30 }
// );

export default crons; 