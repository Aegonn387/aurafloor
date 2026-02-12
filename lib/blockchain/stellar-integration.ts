import {
  rpc,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  Account,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk'

const CONTRACTS = {
  profiles: 'CDZOFXA2SH7MGETQZ55NSTABPGTFI3MBCQXZNIH5FWPFMPCNX3PVYEVS',
  nft: 'CDWCKCICMF2CQQ32V56BHBAMLXUAQYGOWYMY2UMUWCNNP5LVUPZS5O2H',
  marketplace: 'CB6CYMW3UUDM7BG4NYLAEZBKPVPZPVU3FRH7OMK4XPBK6LPN6RSBE2XZ',
}

const STELLAR_RPC_URL = 'https://soroban-testnet.stellar.org'
const NETWORK_PASSPHRASE = Networks.TESTNET
const server = new rpc.Server(STELLAR_RPC_URL)

export interface NFTListing {
  tokenId: string
  price?: number
  seller?: string
  isListed?: boolean
  owner?: string
}

class StellarIntegration {
  private nftContract: Contract
  private marketplaceContract: Contract

  constructor() {
    this.nftContract = new Contract(CONTRACTS.nft)
    this.marketplaceContract = new Contract(CONTRACTS.marketplace)
  }

  async checkConnection(): Promise<boolean> {
    try {
      const health = await server.getHealth()
      return health.status === 'healthy'
    } catch (error: any) {
      return false
    }
  }

  async getAllListings(): Promise<any[]> {
    try {
      const listings = []
      for (let i = 0; i < 100; i++) {
        try {
          const owner = await this.getTokenOwner(i)
          if (owner) listings.push({ tokenId: i.toString(), owner })
        } catch (error) {
          break
        }
      }
      return listings
    } catch (error: any) {
      return []
    }
  }

  async getListing(tokenId: string): Promise<NFTListing | null> {
    try {
      const tokenIdNum = parseInt(tokenId)
      const owner = await this.getTokenOwner(tokenIdNum)
      if (!owner) return null
      return { tokenId, owner, isListed: false }
    } catch (error: any) {
      return null
    }
  }

  async getTokenOwner(tokenId: number): Promise<string | null> {
    try {
      const randomKeypair = Keypair.random()
      const sourceAccount = new Account(randomKeypair.publicKey(), '0')
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(this.nftContract.call('owner_of', nativeToScVal(tokenId, { type: 'u64' })))
        .setTimeout(30)
        .build()
      const response = await server.simulateTransaction(transaction)
      
      if (rpc.Api.isSimulationSuccess(response)) {
        const result = response.result?.retval
        if (result) return scValToNative(result)
      }
      return null
    } catch (error: any) {
      return null
    }
  }

  async tokenExists(tokenId: number): Promise<boolean> {
    const owner = await this.getTokenOwner(tokenId)
    return owner !== null
  }

  getNetworkInfo() {
    return {
      network: 'TESTNET',
      rpcUrl: STELLAR_RPC_URL,
      contracts: CONTRACTS,
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  }
}

export const stellarIntegration = new StellarIntegration()
export default StellarIntegration
