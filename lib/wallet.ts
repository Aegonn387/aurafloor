import { rpc, Transaction } from '@stellar/stellar-sdk';

declare global {
  interface Window {
    Pi?: {
      init: (config: {
        apiVersion: string;
        network: string;
        appId: string;
        scopes: string[];
      }) => void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => Promise<any>
      ) => Promise<{
        user: {
          uid: string;
          username: string;
          wallet_address: string;
        };
        accessToken: string;
      }>;
      createPayment: (
        data: { amount: number; memo: string; metadata: any },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => Promise<any>;
          onReadyForServerCompletion: (paymentId: string, txid: string) => Promise<any>;
          onCancel: (paymentId: string) => void;
          onError: (error: Error, payment: any) => void;
        }
      ) => Promise<{ paymentId: string }>;
      Wallet: {
        submitTransaction: (xdr: string) => Promise<{ hash: string }>;
        getUserMigratedWalletAddresses: () => Promise<{ wallets: { publicKey: string }[] }>;
      };
    };
  }
}

export async function getPublicKey(): Promise<string> {
  if (!window.Pi) throw new Error('Pi SDK not loaded');
  const result = await window.Pi.Wallet.getUserMigratedWalletAddresses();
  return result.wallets[0]?.publicKey || '';
}

export async function signTransaction(tx: Transaction): Promise<string> {
  if (!window.Pi) throw new Error('Pi SDK not loaded');
  const xdr = tx.toEnvelope().toXDR('base64');
  const result = await window.Pi.Wallet.submitTransaction(xdr);
  return result.hash;
}
