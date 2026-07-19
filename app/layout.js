import './globals.css';

export const metadata = {
  title: 'ChatApp — Real-time Messaging',
  description: 'A WhatsApp-like real-time chat application. Chat with anyone, anytime.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ChatApp',
  },
  formatDetection: { telephone: false },
  themeColor: '#00a884',
};

export const viewport = {
  themeColor: '#00a884',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Apple PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ChatApp" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme */}
        <meta name="theme-color" content="#00a884" />
        <meta name="msapplication-TileColor" content="#00a884" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />

        {/* Mobile */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ChatApp — Real-time Messaging" />
        <meta property="og:description" content="A WhatsApp-like real-time chat application" />
        <meta property="og:image" content="/icon-512.png" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('SW registered:', reg.scope); })
                    .catch(function(err) { console.log('SW error:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

