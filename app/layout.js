import "./globals.css";

export const metadata = {
  title: process.env.NEXT_PUBLIC_TITLE,
  description: process.env.NEXT_PUBLIC_DESCRIPTION,
};

const bodyStyle = {
  background: 'var(--bg)'
}

const appStyle = {
  color: `#${process.env.NEXT_PUBLIC_THEME}`,
  width: '100%',
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
