import { Contract, rpc, xdr, Address, nativeToScVal, scValToNative, TransactionBuilder } from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

const server = new rpc.Server(RPC_URL);

export const CONTRACT_IDS = {
  audioMint: process.env.NEXT_PUBLIC_AUDIO_MINT_CONTRACT!,
  marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT!,
  subscription: process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT!,
};

// Helper: Submit a transaction using Pi Wallet, return the hash
async function submitTx(signer: (tx: any) => Promise<string>, tx: any): Promise<string> {
  const hash = await signer(tx);
  return hash;
}

export async function mintAudioNFT(
  signer: (tx: any) => Promise<string>,
  to: string,
  metadataCid: string,
  audioUrl: string,
  royaltyReceiver: string,
  royaltyBps: number
): Promise<string> {
  const contract = new Contract(CONTRACT_IDS.audioMint);
  const account = await server.getAccount(to);
  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'mint',
        new Address(to).toScVal(),
        nativeToScVal(metadataCid, { type: 'string' }),
        nativeToScVal(audioUrl, { type: 'string' }),
        new Address(royaltyReceiver).toScVal(),
        nativeToScVal(royaltyBps, { type: 'u32' })
      )
    )
    .setTimeout(30)
    .build();

  return await submitTx(signer, tx);
}

export async function listNFT(
  signer: (tx: any) => Promise<string>,
  seller: string,
  nftContract: string,
  tokenId: number,
  price: number,
  royaltyBps: number
): Promise<string> {
  const contract = new Contract(CONTRACT_IDS.marketplace);
  const account = await server.getAccount(seller);
  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'list',
        new Address(seller).toScVal(),
        new Address(nftContract).toScVal(),
        nativeToScVal(tokenId, { type: 'u32' }),
        nativeToScVal(price, { type: 'i128' }),
        nativeToScVal(royaltyBps, { type: 'i128' })
      )
    )
    .setTimeout(30)
    .build();

  return await submitTx(signer, tx);
}

export async function buyNFT(
  signer: (tx: any) => Promise<string>,
  buyer: string,
  listingId: string
): Promise<string> {
  const contract = new Contract(CONTRACT_IDS.marketplace);
  const account = await server.getAccount(buyer);
  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'buy',
        new Address(buyer).toScVal(),
        nativeToScVal(listingId, { type: 'symbol' })
      )
    )
    .setTimeout(30)
    .build();

  return await submitTx(signer, tx);
}

export async function getListing(listingId: string) {
  const contract = new Contract(CONTRACT_IDS.marketplace);
  const dummy = await server.getAccount(CONTRACT_IDS.marketplace);
  const tx = new TransactionBuilder(dummy, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'get_listing',
        nativeToScVal(listingId, { type: 'symbol' })
      )
    )
    .setTimeout(30)
    .build();

  const sim: any = await server.simulateTransaction(tx);
  if (!sim || !sim.result) return null;
  return scValToNative(sim.result);
}

export async function subscribeToService(
  signer: (tx: any) => Promise<string>,
  subscriber: string,
  serviceId: string,
  approvePeriods: number
): Promise<string> {
  const contract = new Contract(CONTRACT_IDS.subscription);
  const account = await server.getAccount(subscriber);
  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'subscribe',
        new Address(subscriber).toScVal(),
        nativeToScVal(serviceId, { type: 'symbol' }),
        nativeToScVal(approvePeriods, { type: 'u32' })
      )
    )
    .setTimeout(30)
    .build();

  return await submitTx(signer, tx);
}

export async function createService(
  signer: (tx: any) => Promise<string>,
  admin: string,
  serviceId: string,
  price: number,
  billingPeriodDays: number,
  trialPeriodDays: number,
  maxPeriods: number
): Promise<string> {
  const contract = new Contract(CONTRACT_IDS.subscription);
  const account = await server.getAccount(admin);
  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'register_service',
        new Address(admin).toScVal(),
        nativeToScVal(serviceId, { type: 'symbol' }),
        nativeToScVal(price, { type: 'i128' }),
        nativeToScVal(billingPeriodDays, { type: 'u32' }),
        nativeToScVal(trialPeriodDays, { type: 'u32' }),
        nativeToScVal(maxPeriods, { type: 'u32' })
      )
    )
    .setTimeout(30)
    .build();

  return await submitTx(signer, tx);
}
