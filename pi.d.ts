// pi.d.ts
export {};

declare global {
  interface PiPayment {
    identifier: string;
    user_uid: string;
    amount: number;
    memo: string;
    metadata: Record<string, any>;
    from_address: string;
    to_address: string;
    direction: string;
    created_at: string;
    network: string;
    status: {
      developer_approved: boolean;
      transaction_verified: boolean;
      developer_completed: boolean;
      cancelled: boolean;
      user_cancelled: boolean;
    };
    transaction: any;
  }

  interface PiCreatePaymentOptions {
    amount: number;
    memo: string;
    metadata: Record<string, any>;
  }

  interface PiAuthResult {
    accessToken: string;
    user: {
      uid: string;
      username: string;
    };
  }

  interface Window {
    Pi?: {
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound?: (payment: PiPayment) => void
      ) => Promise<PiAuthResult>;
      createPayment: (options: PiCreatePaymentOptions) => Promise<PiPayment>;
      openShareDialog: (title: string, message: string) => void;
    };
  }
}