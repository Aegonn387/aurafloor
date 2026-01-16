import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { Footer } from '@/components/footer'
import { Player } from '@/components/player/player'

const inter = Inter({ subsets: ['latin'] })

export const runtime = 'nodejs'

export const metadata: Metadata = {
  title: 'Aurafloor',
  description: 'Your audio NFT marketplace',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={inter.className}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#ffffff"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#000000"
        />
        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Pi SDK Loader - Ensures proper initialization
            (function() {
              if (typeof window === 'undefined') return;
              
              // Track initialization state
              window._piSdkState = { loaded: false, initialized: false };
              
              // Function to initialize Pi
              function initializePiSdk() {
                if (window.Pi && !window._piSdkState.initialized) {
                  try {
                    window.Pi.init({ version: "2.0", sandbox: true });
                    window._piSdkState.initialized = true;
                    window._piSdkState.loaded = true;
                    console.log('Pi SDK initialized globally');
                    
                    // Dispatch custom event so components know SDK is ready
                    window.dispatchEvent(new CustomEvent('pi-sdk-ready'));
                  } catch (error) {
                    console.error('Failed to initialize Pi SDK:', error);
                  }
                }
              }
              
              // Check if already loaded (e.g., from another script)
              if (window.Pi) {
                initializePiSdk();
                return;
              }
              
              // Load Pi SDK
              const script = document.createElement('script');
              script.src = 'https://sdk.minepi.com/pi-sdk.js';
              script.async = true;
              
              script.onload = function() {
                console.log('Pi SDK script loaded');
                setTimeout(initializePiSdk, 100);
              };
              
              script.onerror = function() {
                console.error('Failed to load Pi SDK script');
                window._piSdkState.error = 'Failed to load Pi SDK';
              };
              
              document.head.appendChild(script);
              
              // Fallback: check periodically if SDK loaded but onload didn't fire
              let attempts = 0;
              const checkPiLoaded = setInterval(function() {
                attempts++;
                if (window.Pi && !window._piSdkState.initialized) {
                  initializePiSdk();
                  clearInterval(checkPiLoaded);
                }
                if (attempts > 20) { // 10 second timeout
                  clearInterval(checkPiLoaded);
                  console.warn('Pi SDK load timeout');
                }
              }, 500);
            })();
          `
        }} />
      </head>
      <body className="antialiased text-base md:text-[16px] leading-relaxed bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            {children}
            
            {/* Global Audio Player */}
            <Player />
            
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
