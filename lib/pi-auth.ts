// Type definitions for Pi Network SDK v2.0
// Based on official Pi SDK documentation

export interface PiUser {
  uid: string
  username: string
  accessToken: string
  role?: "creator" | "collector"
}

export interface PiPayment {
  amount: number
  memo: string
  metadata: Record<string, unknown>
}

// NEW: Pi SDK type definitions
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
  appId?: string;
}

// Add PiSDK interface to global Window
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
  isAvailable: () => {
    if (typeof window === "undefined") return false
    return "Pi" in window
  },

  getBrowserInfo: () => {
    if (typeof window === "undefined") return { isPiBrowser: false, userAgent: "" }
    return {
      isPiBrowser: "Pi" in window,
      userAgent: navigator.userAgent,
    }
  },

  // UPDATED: Initialize the Pi SDK with App ID
  initialize: (sandboxMode: boolean = process.env.NODE_ENV === "development"): boolean => {
    if (typeof window === "undefined" || !window.Pi) return false;

    try {
      const appId = process.env.NEXT_PUBLIC_PI_APP_ID;
      
      if (!appId) {
        console.error("[Pi SDK] App ID not found in environment variables");
        return false;
      }

      window.Pi.init({ 
        version: "2.0", 
        sandbox: sandboxMode,
        appId: appId
      });
      
      console.log("[Pi SDK] Initialized with version 2.0, sandbox:", sandboxMode, "appId:", appId);
      return true;
    } catch (error) {
      console.error("[Pi SDK] Initialization error:", error);
      return false;
    }
  },

  authenticate: async (): Promise<PiUser> => {
    if (!window.Pi) {
      throw new Error("Pi SDK not available")
    }

    const scopes = ["username", "payments"]
    const onIncompletePaymentFound = (payment: any) => {
      console.log("Incomplete payment found:", payment)
    }

    try {
      const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound)
      console.log("Pi authentication successful:", auth)

      return {
        uid: auth.user.uid,
        username: auth.user.username,
        accessToken: auth.accessToken,
      }
    } catch (error) {
      console.error("Pi authentication failed:", error)
      throw error
    }
  },

  createPayment: async (payment: PiPayment): Promise<string> => {
    if (!window.Pi) {
      throw new Error("Pi SDK not available")
    }

    console.log("Creating Pi payment:", payment)

    const paymentData = {
      amount: payment.amount,
      memo: payment.memo,
      metadata: payment.metadata,
    }

    const callbacks = {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log("Payment ready for approval:", paymentId)

        try {
          const response = await fetch("/api/payments/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          })

          if (!response.ok) {
            throw new Error("Failed to approve payment")
          }

          console.log("Payment approved:", paymentId)
        } catch (error) {
          console.error("Payment approval failed:", error)
          throw error
        }
      },

      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log("Payment ready for completion:", paymentId, txid)

        try {
          const response = await fetch("/.netlify/functions/complete-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          })

          if (!response.ok) {
            throw new Error("Failed to complete payment")
          }

          console.log("Payment completed:", paymentId)
        } catch (error) {
          console.error("Payment completion failed:", error)
          throw error
        }
      },

      onCancel: (paymentId: string) => {
        console.log("Payment cancelled:", paymentId)
      },

      onError: (error: Error, payment?: any) => {
        console.error("Payment error:", error, payment)
      },
    }

    try {
      const paymentResult = await window.Pi.createPayment(paymentData, callbacks)
      console.log("Payment created:", paymentResult)
      return paymentResult.identifier
    } catch (error) {
      console.error("Failed to create payment:", error)
      throw error
    }
  },
}
