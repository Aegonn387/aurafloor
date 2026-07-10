export const PI_CONFIG = {
  apiVersion: "v2",
  network: "testnet",
  appId: process.env.PI_APP_ID || process.env.NEXT_PUBLIC_PI_APP_ID || "",
  apiKey: process.env.PI_API_KEY || process.env.PI_NETWORK_API_KEY || "",
  baseUrl: {
    mainnet: "https://api.mainnet.minepi.com/v2",
    testnet: "https://api.testnet.minepi.com/v2",
  },
  scopes: ["payments", "username", "wallet_address"],
  contractConfig: {
    enabled: true,
    networkPassphrase: "Pi Testnet",
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

export function validatePiConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!PI_CONFIG.appId) errors.push("PI_APP_ID is not set");
  if (!PI_CONFIG.apiKey) errors.push("PI_API_KEY is not set");
  return { valid: errors.length === 0, errors };
}
