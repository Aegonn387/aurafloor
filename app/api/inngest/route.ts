export const dynamic = 'force-dynamic'

// app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { homepageAggregator } from "@/lib/services/homepage-aggregator";

// Define the function
const updateHomepageCache = inngest.createFunction(
  {
    id: "update-homepage-cache",
    name: "Update Homepage Cache (Promoted, Featured, Trending)",
  },
  { cron: "*/15 * * * *" }, // Runs every 15 minutes
  async ({ step }) => {
    console.log("?? Inngest job triggered: update-homepage-cache");
    
    await step.run("update-cache", async () => {
      await homepageAggregator.updateHomepageCache();
    });
    
    return { message: "Homepage cache updated successfully" };
  }
);

// Export the handler for Next.js API route
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [updateHomepageCache],
});
