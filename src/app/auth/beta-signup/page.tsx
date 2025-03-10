'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import { Suspense } from 'react'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

function BetaSignUpContent() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !email || !agreedTerms) {
      setError('Please fill in all fields and agree to the terms')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Save the beta request info
      await fetch('/api/beta/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          name
        }),
      })
      
      // Track the event in analytics
      trackEvent(AnalyticsEvents.BETA_REQUESTED, {
        source: 'beta_signup_form'
      })
      
      // Show success message and redirect
      toast.success('Your beta access request has been submitted!')
      router.push('/auth/beta-success')
      
    } catch (err) {
      console.error(err)
      setError('An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-6 justify-center">
          <div className="bg-primary/10 p-1.5 rounded-full">
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
      
        <Card className="shadow-lg dark:bg-gray-800">
          <CardHeader className="text-center pb-2">
            <h1 className="text-2xl font-bold">Request Beta Access</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Join our exclusive beta program and be the first to use ZapJob
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-red-500 text-sm text-center p-2 bg-red-50 dark:bg-red-950/30 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedTerms} 
                  onCheckedChange={(checked) => setAgreedTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-tight">
                  I agree to receive updates about ZapJob and understand my data will be processed in accordance with the <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                </Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full rounded-full mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Request Beta Access'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 pt-0">
            <div className="text-center text-sm">
              <Link href="/" className="text-primary hover:underline">
                Return to Home
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function BetaSignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BetaSignUpContent />
    </Suspense>
  )
}