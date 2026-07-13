import './globals.css';

export const metadata = {
  title: 'THE LEX CONCEPT — Brand & Graphic Design',
  description:
    'Portfolio of Alexandra Fajemirokun — brand identity, logo, flyer, poster, and print design.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnecting to the font hosts (rather than the old CSS @import,
            which is render-blocking and discovered late) shaves real time
            off first paint. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />

        {/* Runs before paint so the site never flashes the wrong theme.
            Scoped to public pages only - a visitor's theme choice is
            personal to them and should never change how the admin
            dashboard looks, even in the same browser. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (window.location.pathname.startsWith('/admin')) return;
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') document.documentElement.classList.add('light');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
