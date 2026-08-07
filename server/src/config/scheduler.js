// Scheduled jobs (spec: node-cron for scraper refresh).
import cron from "node-cron";
import { runScraper } from "../services/scraper.js";

export const startScheduler = () => {
  // Every day at 06:00 server time: refresh scholarship data.
  cron.schedule("0 6 * * *", async () => {
    console.log("⏰ [cron] Running scheduled scholarship scrape...");
    try {
      const report = await runScraper();
      for (const r of report) {
        console.log(
          `   ${r.source}: found ${r.found}, added ${r.added}, dupes ${r.duplicates}, flagged ${r.flagged}${r.error ? `, ERROR: ${r.error}` : ""}`
        );
      }
    } catch (err) {
      console.error("   [cron] scrape failed:", err.message);
    }
  });
  console.log("⏰ Scheduler active: scholarship scrape daily at 06:00");
};
