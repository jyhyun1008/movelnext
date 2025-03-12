import "./globals.css";

export const viewport = {
  themeColor: `#${process.env.NEXT_PUBLIC_THEME}`,
};

export const metadata = {
  title: process.env.NEXT_PUBLIC_TITLE,
  description: process.env.NEXT_PUBLIC_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: process.env.NEXT_PUBLIC_TITLE
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: process.env.NEXT_PUBLIC_TITLE,
    title: {
      default: process.env.NEXT_PUBLIC_TITLE,
    },
    description: process.env.NEXT_PUBLIC_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: process.env.NEXT_PUBLIC_TITLE,
    },
    description: process.env.NEXT_PUBLIC_DESCRIPTION,
  },
};

const bodyStyle = {
  background: 'var(--bg)'
}

const appStyle = {
  color: `#${process.env.NEXT_PUBLIC_THEME}`,
  width: 'calc(100% - 20px)',
  maxWidth: '540px',
  height: 'calc(100dvh - 20px)',
  margin: '10px auto',
  borderRadius: '20px',
  background: 'var(--white)',
  boxShadow: `5px 5px 15px #00005511`,
  overflow: 'hidden',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content={`#${process.env.NEXT_PUBLIC_THEME}`} />
        <meta name="theme-color" content={`#${process.env.NEXT_PUBLIC_THEME}`} />
        <link rel= "stylesheet" href= "https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css" />
      </head>
      <body style={bodyStyle}>
        <div style={appStyle}>
          {children}
        </div>
      </body>
    </html>
  );
}
