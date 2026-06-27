"use client"

import { useState, useCallback } from "react"

interface PaymentData {
  amount: number
  memo: string
  metadata: Record<string, any>
}

interface UsePiPaymentReturn {
  createPayment: (data: PaymentData) => Promise<string | null>
  loading: boolean
  error: string | null
}

export function usePiPayment(): UsePiPaymentReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPayment = useCallback(async (paymentData: PaymentData): Promise<string | null> => {
    if (typeof window === "undefined" || !window.Pi) {
      setError("Pi SDK not available. Please use Pi Browser.")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      const baseUrl = isLocalhost ? "http://localhost:8888" : ""

      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("[Payment] Server approval needed:", paymentId)
          const res = await fetch(`${baseUrl}/.netlify/functions/approve-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          })
          if (!res.ok) {
            const err = await res.text()
            throw new Error(`Approval failed: ${err}`)
          }
          return await res.json()
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("[Payment] Server completion needed:", paymentId, txid)
          const res = await fetch(`${baseUrl}/.netlify/functions/complete-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payment: { identifier: paymentId, transaction: { txid } } }),
          })
          if (!res.ok) {
            const err = await res.text()
            throw new Error(`Completion failed: ${err}`)
          }
          return await res.json()
        },

        onIncompletePaymentFound: async (payment: any) => {
          console.log("[Payment] Incomplete payment found:", payment)
          const res = await fetch(`${baseUrl}/.netlify/functions/complete-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payment }),
          })
          if (!res.ok) {
            const err = await res.text()
            console.error("Incomplete payment completion failed:", err)
          }
        },

        onCancel: (paymentId: string) => {
          console.log("[Payment] Cancelled:", paymentId)
          setLoading(false)
        },

        onError: (err: any, payment: any) => {
          console.error("[Payment] Error:", err, payment)
          setError(err?.message || "Payment error")
          setLoading(false)
        },
      }

      const payment = await window.Pi.createPayment(paymentData, callbacks)
      console.log("[Payment] Created:", payment)

      setLoading(false)
      return payment.paymentId || null
    } catch (err: any) {
      console.error("[Payment] Failed:", err)
      setError(err.message || "Payment creation failed")
      setLoading(false)
      return null
    }
  }, [])

  return { createPayment, loading, error }
}
