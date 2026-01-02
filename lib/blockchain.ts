import Server from "stellar-sdk"
import { Keypair, TransactionBuilder, Networks, Operation, Asset } from "stellar-sdk"

const server = new Server(
  process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org"
)

// Example function
export async function getAccountBalances(publicKey: string) {
  const account = await server.loadAccount(publicKey)
  return account.balances
}

// Export other Stellar helpers as needed
export { Keypair, TransactionBuilder, Networks, Operation, Asset, server }
