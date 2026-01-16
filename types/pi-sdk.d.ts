// types/pi-sdk.d.ts
interface PiSDKConfig {
  version: string
  sandbox?: boolean
}

interface PaymentDTO {
  amount: number
  memo: string
  metadata: any
}

interface PaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void
  onReadyForServerCompletion: (paymentId: string, txid: string) => void
  onCancel: (paymentId: string) => void
  onError: (error: Error, payment?: any) => void
}

interface PiPayment {
  identifier: string
  user_uid: string
  amount: number
  memo: string
  metadata: any
  from_address: string
  to_address: string
  direction: string
  status: {
    developer_approved: boolean
    transaction_verified: boolean
    developer_completed: boolean
    cancelled: boolean
    user_cancelled: boolean
  }
  transaction: {
    txid: string
    verified: boolean
    _link: string
  } | null
  created_at: string
}

interface PiNetwork {
  init: (config: PiSDKConfig) => void
  authenticate: (scopes: string[], onIncompletePaymentFound: (payment: PiPayment) => void) => Promise<any>
  createPayment: (payment: PaymentDTO, callbacks: PaymentCallbacks) => Promise<PiPayment>
  openShareDialog: (title: string, message: string) => void
}

interface Window {
  Pi?: PiNetwork
}

declare global {
  interface Window {
    Pi?: PiNetwork
  }
}

export {}
