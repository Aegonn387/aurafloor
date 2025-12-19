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

// Mock Pi SDK for development (replace with actual Pi SDK in production)
export const PiAuth = {
  isAvailable: () => {
    // Check if running in Pi Browser
    if (typeof window === "undefined") return false
    return "Pi" in window || navigator.userAgent.includes("PiBrowser")
  },

  getBrowserInfo: () => {
    if (typeof window === "undefined") return { isPiBrowser: false, userAgent: "" }
    return {
      isPiBrowser: navigator.userAgent.includes("PiBrowser") || "Pi" in window,
      userAgent: navigator.userAgent,
    }
  },

  authenticate: async (): Promise<PiUser> => {
    // In production, use: await window.Pi.authenticate(scopes, onIncompletePaymentFound)
    // For now, using mock implementation for development
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          uid: "demo_user_" + Math.random().toString(36).substr(2, 9),
          username: "DemoUser" + Math.floor(Math.random() * 1000),
          accessToken: "demo_token_" + Date.now(),
        })
      }, 500)
    })
  },

  createPayment: async (payment: PiPayment): Promise<string> => {
    // In production, use: await window.Pi.createPayment(payment, callbacks)
    console.log("[v0] Creating Pi payment:", payment)
    return new Promise((resolve) => {
      setTimeout(() => {
        const paymentId = "payment_" + Math.random().toString(36).substr(2, 9)
        console.log("[v0] Payment created:", paymentId)
        resolve(paymentId)
      }, 1000)
    })
  },
}
