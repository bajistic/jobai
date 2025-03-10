'use client'

import { signIn, useSession } from 'next-auth/react'
import { useState } from 'react'
import { redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import Link from 'next/link'
import { Suspense } from 'react'

function SignInContent() {
  const { data: session } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (session) {
    redirect('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials')
      }
    } catch {
      setError('An error occurred')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8 text-gray-900 dark:text-gray-50">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-6 justify-center">
          <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M13 2H3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V9z"></path>
              <path d="M13 2v7h7"></path>
              <path d="m9 17-2-2-2 2"></path>
              <path d="M9 11v6"></path>
              <path d="m17 17 2-2 2 2"></path>
              <path d="M17 11v6"></path>
            </svg>
          </div>
          <span className="text-xl font-bold">ZapJob</span>
        </Link>
        
        <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center pb-2">
            <h1 className="text-2xl font-bold">Beta Access Sign In</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Sign in with your approved beta credentials
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 p-3 rounded-md mb-4 text-sm border border-blue-100 dark:border-blue-800">
              <p>Access is currently limited to approved beta testers only.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-red-500 dark:text-red-400 text-sm text-center p-2 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-100 dark:border-red-900/50">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="dark:border-gray-700 dark:bg-gray-800/50"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="dark:border-gray-700 dark:bg-gray-800/50"
                />
              </div>
              <Button type="submit" className="w-full rounded-full">
                Sign In
              </Button>
            </form>
            <div className="mt-4 text-center text-sm dark:text-gray-300">
              Need beta access?{' '}
              <Link href="/auth/beta-signup" className="text-primary hover:underline">
                Request Access
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
} 