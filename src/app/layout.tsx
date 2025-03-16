'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Inter } from "next/font/google"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import "./globals.css"
import { Providers } from '@/app/providers'
import { usePathname } from 'next/navigation'
import { JobProvider } from '@/contexts/JobContext'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { Toaster as UIToaster } from '@/components/ui/toaster'
import GoogleAnalytics from '@/components/GoogleAnalytics'

const Header = dynamic(() => import('@/components/Header'), { ssr: false })
const LoadingDashboard = dynamic(() => import('@/components/LoadingDashboard'), { ssr: false })
// Sidebar is now included in Header

const inter = Inter({ subsets: ["latin"] });

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Don't check auth for auth-related pages and error pages
  if (pathname === '/auth/signin' || pathname === '/auth/signup' || 
      pathname === '/auth/beta-signup' || pathname === '/auth/beta-success' ||
      pathname === '/beta' ||
      pathname === '/404' || pathname === '/_not-found') {
    return <>{children}</>
  }

  // For the home page, we handle authentication in the page component
  if (pathname === '/') {
    // If still loading session, show loading indicator
    if (status === 'loading') {
      return <LoadingDashboard />
    }
    
    // If no session but on homepage, let the page component handle it (landing page)
    if (!session) {
      return <>{children}</>
    }
    
    // If authenticated, render with layout
    return (
      <div className="flex h-screen w-screen overflow-hidden">
        <div className="flex flex-col w-full h-full overflow-hidden">
          <Header onToggleJobList={() => {}} showJobList={false} />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // Protect all other routes
  if (status !== 'loading' && !session) {
    redirect('/auth/signin')
  }

  if (status === 'loading') {
    return <LoadingDashboard />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="flex flex-col w-full h-full overflow-hidden">
        <Header onToggleJobList={() => {}} showJobList={false} />
        <main className="flex-1 overflow-hidden">
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <JobProvider>
          <Providers>
            <Suspense fallback={<LoadingDashboard />}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <RootLayoutContent>{children}</RootLayoutContent>
              </ThemeProvider>
            </Suspense>
          </Providers>
          <Toaster />
          <UIToaster />
          <GoogleAnalytics />
        </JobProvider>
      </body>
    </html>
  )
}
