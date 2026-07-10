// lib/pi-config.ts — AuraFloor Pi Config (2026 Protocol v25)
// Updated for bundled SDK + backend infrastructure expansion

export const PI_CONFIG = {
  // 2026 bundled SDK uses apiVersion, not version
  apiVersion: "v2",
  
  // Explicit network selection — sandbox boolean is deprecated
  network: process.env.NODE_ENV === "development" ? "testnet" : "mainnet",
  
  // Your Pi App Studio app ID (required for Mainnet apps)
  appId: process.env.PI_APP_ID || "",
  
  // Backend API key for server-side calls (A2U payments, user verify)
  apiKey: process.env.PI_API_KEY || "",
  
  // Base URLs updated for Protocol v25 infrastructure expansion
  baseUrl: {
    mainnet: "https://api.mainnet.minepi.com/v2",
    testnet: "https://api.testnet.minepi.com/v2",
  },
  
  // Payment flow scopes — 2026 requires explicit declaration
  scopes: ["payments", "username", "wallet_address"],
  
  // NFT smart contract config (Protocol 20, March 2026)
  contractConfig: {
    enabled: true,
    networkPassphrase: process.env.NODE_ENV === "development" 
      ? "Pi Testnet" 
      : "Pi Network",
  },
};

export function getPiInitOptions() {
  return {
    apiVersion: PI_CONFIG.apiVersion,
    network: PI_CONFIG.network,
    appId: PI_CONFIG.appId,
    scopes: PI_CONFIG.scopes,
  };
}

export function getBackendConfig() {
  const network = PI_CONFIG.network as "mainnet" | "testnet";
  return {
    baseUrl: PI_CONFIG.baseUrl[network],
    apiKey: PI_CONFIG.apiKey,
    headers: {
      "Authorization": `Key ${PI_CONFIG.apiKey}`,
      "Content-Type": "application/json",
    },
  };
}

// Helper to check if config is valid before making calls
export function validatePiConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!PI_CONFIG.appId) errors.push("PI_APP_ID is not set");
  if (!PI_CONFIG.apiKey) errors.push("PI_API_KEY is not set");
  if (!PI_CONFIG.apiVersion) errors.push("apiVersion is missing");
  if (!PI_CONFIG.network) errors.push("network is missing");
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
