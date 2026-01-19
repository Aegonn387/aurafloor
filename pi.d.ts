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

  interface PiPaymentCallbacks {
    onReadyForServerApproval?: (paymentId: string) => void | Promise<void>;
    onReadyForServerCompletion?: (paymentId: string, txid: string) => void | Promise<void>;
    onCancel?: (paymentId: string) => void | Promise<void>;
    onError?: (error: Error, paymentId: string) => void | Promise<void>;
  }

  interface PiAuthResult {
    accessToken: string;
    user: {
      uid: string;
      username: string;
    };
  }

  interface PiInitOptions {
    version: string;
    sandbox?: boolean;
  }

  interface Window {
    Pi?: {
      init: (options: PiInitOptions) => void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound?: (payment: PiPayment) => void
      ) => Promise<PiAuthResult>;
      createPayment: (
        options: PiCreatePaymentOptions,
        callbacks?: PiPaymentCallbacks
      ) => Promise<PiPayment>;
      openShareDialog: (title: string, message: string) => void;
    };
  }
}