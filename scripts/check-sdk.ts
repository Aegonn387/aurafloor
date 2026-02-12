import * as StellarSdk from "@stellar/stellar-sdk";

console.log("SDK version from package.json:", require("@stellar/stellar-sdk/package.json").version);
console.log("Keys containing 'Soroban' or 'Rpc':", Object.keys(StellarSdk).filter(k => k.includes("Soroban") || k.includes("Rpc")));
console.log("StellarSdk.Soroban exists:", !!StellarSdk.Soroban);
console.log("StellarSdk.Rpc exists:", !!StellarSdk.Rpc);

if (StellarSdk.Soroban) {
  console.log("Soroban keys:", Object.keys(StellarSdk.Soroban));
}

if (StellarSdk.Rpc) {
  console.log("Rpc keys:", Object.keys(StellarSdk.Rpc));
}
