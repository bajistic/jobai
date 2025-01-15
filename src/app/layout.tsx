'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Inter } from "next/font/google"
import "./globals.css"

const Header = dynamic(() => import('@/components/Header'), { ssr: false })
const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false })

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [showJobList, setShowJobList] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header 
              onToggleJobList={() => setShowJobList(!showJobList)} 
              showJobList={showJobList}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
