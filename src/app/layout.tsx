'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Inter } from "next/font/google"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import "./globals.css"
import { Providers } from '@/app/providers'
import { usePathname } from 'next/navigation'
import { JobProvider } from '@/contexts/JobContext'
import { ThemeProvider } from '@/components/theme-provider'

const Header = dynamic(() => import('@/components/Header'), { ssr: false })
const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false })

const inter = Inter({ subsets: ["latin"] });

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [showJobList, setShowJobList] = useState(true)

  // Don't check auth for auth-related pages
  if (pathname === '/auth/signin' || pathname === '/auth/signup') {
    return <>{children}</>
  }

  // Protect all other routes
  if (status !== 'loading' && !session) {
    redirect('/auth/signin')
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          onToggleJobList={() => setShowJobList(!showJobList)} 
          showJobList={showJobList}
        />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <JobProvider>
          <Providers>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <RootLayoutContent>{children}</RootLayoutContent>
            </ThemeProvider>
          </Providers>
        </JobProvider>
      </body>
    </html>
  );
}
