// Global type declarations for Aurafloor
declare global {
  interface Window {
    Pi?: {
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => void
      ) => Promise<{
        accessToken: string
        user: {
          uid: string
          username: string
        }
      }>
      init: (config: { version: string; sandbox?: boolean }) => void
    }
  }
}

export {}