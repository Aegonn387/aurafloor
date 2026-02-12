// Simple file existence test
const fs = require("fs");
const path = require("path");

console.log("Testing approve-payment.ts file...\n");

const filePath = path.join(__dirname, "../netlify/functions/approve-payment.ts");

if (fs.existsSync(filePath)) {
  console.log("✅ File exists:", filePath);
  
  const content = fs.readFileSync(filePath, "utf8");
  console.log("✅ File size:", content.length, "characters");
  
  // Basic checks
  if (content.includes("export const handler")) console.log("✅ Has handler export");
  if (content.includes("@neondatabase/serverless")) console.log("✅ Uses NeonDB");
  if (content.includes("pending_nft_mints")) console.log("✅ References pending_nft_mints table");
  
  console.log("\n✅ File check complete");
} else {
  console.log("❌ File not found:", filePath);
}
