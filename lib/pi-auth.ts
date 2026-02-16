// lib/pi-auth.ts
// Type definitions for Pi Network SDK v2.0
// Based on official Pi SDK documentation

export interface PiUser {
  uid: string;
  username: string;
  accessToken: string;
  role?: "creator" | "collector";
}

export interface PiPayment {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

export interface PiAuthResult {
  accessToken: string;
  user: {
    uid: string;
    username: string;
  };
}

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: any) => void;
}

export interface PiInitOptions {
  version: string;
  sandbox?: boolean;
  // Note: appId is NOT used in v2.0 – it's derived from the domain
}

// Extend global Window interface
declare global {
  interface Window {
    Pi: {
      init: (options: PiInitOptions) => void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => void
      ) => Promise<PiAuthResult>;
      createPayment: (
        paymentData: { amount: number; memo: string; metadata: any },
        callbacks: PiPaymentCallbacks
      ) => Promise<any>;
    };
  }
}

export const PiAuth = {
  /**
   * Check if Pi SDK is available (i.e., running inside Pi Browser)
   */
  isAvailable: (): boolean => {
    if (typeof window === "undefined") return false;
    return "Pi" in window;
  },

  /**
   * Get browser info for debugging
   */
  getBrowserInfo: () => {
    if (typeof window === "undefined") {
      return { isPiBrowser: false, userAgent: "" };
    }
    return {
      isPiBrowser: "Pi" in window,
      userAgent: navigator.userAgent,
    };
  },

  /**
   * Initialize the Pi SDK.
   * Must be called after ensuring we are in Pi Browser.
   * @param sandboxMode - Set to false for Testnet/Mainnet, true for local sandbox.
   */
  initialize: (sandboxMode: boolean = false): boolean => {
    if (typeof window === "undefined" || !window.Pi) {
      console.warn("[Pi SDK] Not available – are you inside Pi Browser?");
      return false;
    }

    try {
      // No appId needed – it's automatically derived from the registered domain.
      window.Pi.init({
        version: "2.0",
        sandbox: sandboxMode, // false for Testnet/Mainnet
      });
      console.log("[Pi SDK] Initialized with version 2.0, sandbox:", sandboxMode);
      return true;
    } catch (error) {
      console.error("[Pi SDK] Initialization error:", error);
      return false;
    }
  },

  /**
   * Authenticate the user.
   * Requests 'username' and 'payments' scopes.
   */
  authenticate: async (): Promise<PiUser> => {
    if (!window.Pi) {
      throw new Error("Pi SDK not available – please use Pi Browser");
    }

    const scopes = ["username", "payments"];
    const onIncompletePaymentFound = (payment: any) => {
      // Handle incomplete payments if needed
      console.log("[Pi SDK] Incomplete payment found:", payment);
    };

    try {
      const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      console.log("[Pi SDK] Authentication successful:", auth);
      return {
        uid: auth.user.uid,
        username: auth.user.username,
        accessToken: auth.accessToken,
      };
    } catch (error) {
      console.error("[Pi SDK] Authentication failed:", error);
      throw error;
    }
  },

  /**
   * Create a payment.
   */
  createPayment: async (payment: PiPayment): Promise<string> => {
    if (!window.Pi) {
      throw new Error("Pi SDK not available – please use Pi Browser");
    }

    console.log("[Pi SDK] Creating payment:", payment);

    const paymentData = {
      amount: payment.amount,
      memo: payment.memo,
      metadata: payment.metadata,
    };

    const callbacks = {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log("[Pi SDK] Payment ready for approval:", paymentId);
        try {
          const response = await fetch("/api/payments/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
          if (!response.ok) {
            throw new Error("Failed to approve payment");
          }
          console.log("[Pi SDK] Payment approved:", paymentId);
        } catch (error) {
          console.error("[Pi SDK] Payment approval failed:", error);
          throw error;
        }
      },

      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log("[Pi SDK] Payment ready for completion:", paymentId, txid);
        try {
          const response = await fetch("/.netlify/functions/complete-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });
          if (!response.ok) {
            throw new Error("Failed to complete payment");
          }
          console.log("[Pi SDK] Payment completed:", paymentId);
        } catch (error) {
          console.error("[Pi SDK] Payment completion failed:", error);
          throw error;
        }
      },

      onCancel: (paymentId: string) => {
        console.log("[Pi SDK] Payment cancelled:", paymentId);
      },

      onError: (error: Error, payment?: any) => {
        console.error("[Pi SDK] Payment error:", error, payment);
      },
    };

    try {
      const paymentResult = await window.Pi.createPayment(paymentData, callbacks);
      console.log("[Pi SDK] Payment created:", paymentResult);
      return paymentResult.identifier;
    } catch (error) {
      console.error("[Pi SDK] Failed to create payment:", error);
      throw error;
    }
  },
};
