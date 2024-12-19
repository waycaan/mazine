import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <head>
        <title>图床应用</title>
        <meta name="description" content="基于Next.js和对象存储的现代图床应用" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="data:," />
      </head>
      <body className="font-sans min-h-screen m-0 p-0">
        {children}
      </body>
    </html>
  )
}
