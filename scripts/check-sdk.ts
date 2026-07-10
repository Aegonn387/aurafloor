import { rpc, Keypair, Contract, TransactionBuilder, BASE_FEE, Address, nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import { getBackendConfig, validatePiConfig, PI_CONFIG } from "../lib/pi-config";

const stellarVersion = require("@stellar/stellar-sdk/package.json").version;

console.log("Stellar SDK:", stellarVersion);
console.log("Pi network:", PI_CONFIG.network);
console.log("Pi API version:", PI_CONFIG.apiVersion);

const configCheck = validatePiConfig();
console.log("Config valid:", configCheck.valid);
if (!configCheck.valid) console.log("Errors:", configCheck.errors);

const backend = getBackendConfig();
console.log("Base URL:", backend.baseUrl);
console.log("Auth header:", !!backend.headers.Authorization);

const exports = { rpc, Keypair, Contract, TransactionBuilder, BASE_FEE, Address, nativeToScVal, scValToNative };
Object.entries(exports).forEach(([name, val]) => {
  console.log(`${name}:`, typeof val !== "undefined" ? "OK" : "MISSING");
});

console.log("App ID:", PI_CONFIG.appId ? "SET" : "NOT SET");
console.log("API Key:", PI_CONFIG.apiKey ? "SET" : "NOT SET");
console.log("Passphrase:", PI_CONFIG.contractConfig.networkPassphrase);
