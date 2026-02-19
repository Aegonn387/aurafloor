import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { Footer } from '@/components/footer'
import { Player } from '@/components/player/player'
import { MobileNav } from '@/components/mobile-nav'
import { UIPreferenceApplier } from '@/components/ui-preference-applier'

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
            (function() {
              if (typeof window === 'undefined') return;
              window._piSdkState = { loaded: false, initialized: false };
              function initializePiSdk() {
                if (window.Pi && !window._piSdkState.initialized) {
                  try {
                    const sandboxMode = ${process.env.NEXT_PUBLIC_PI_SANDBOX === 'true' ? 'true' : process.env.NODE_ENV !== 'production' ? 'true' : 'false'};
                    window.Pi.init({ version: "2.0", sandbox: sandboxMode });
                    window._piSdkState.initialized = true;
                    window._piSdkState.loaded = true;
                    console.log('Pi SDK initialized globally with sandbox:', sandboxMode);
                    window.dispatchEvent(new CustomEvent('pi-sdk-ready'));
                  } catch (error) {
                    console.error('Failed to initialize Pi SDK:', error);
                  }
                }
              }
              if (window.Pi) {
                initializePiSdk();
                return;
              }
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
              let attempts = 0;
              const checkPiLoaded = setInterval(function() {
                attempts++;
                if (window.Pi && !window._piSdkState.initialized) {
                  initializePiSdk();
                  clearInterval(checkPiLoaded);
                }
                if (attempts > 20) {
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
          <UIPreferenceApplier />
          <MobileNav />
          <div className="min-h-screen flex flex-col pb-20 lg:pb-0">
            <div className="flex-grow">
              {children}
            </div>
            <Player />
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
