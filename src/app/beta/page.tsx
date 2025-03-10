'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function BetaRequestPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !name || !reason || !agreedTerms) {
      toast.error('Please fill in all fields and agree to the terms')
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsSubmitted(true)
      toast.success('Your beta access request has been submitted!')
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="px-6 py-4 border-b bg-white dark:bg-gray-950 dark:border-gray-800">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
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
          <Link href="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto max-w-7xl py-12 px-4">
        <div className="max-w-md mx-auto">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Request Beta Access</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Join our exclusive beta program and be among the first to experience ZapJob.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason">Why are you interested in ZapJob?</Label>
                    <Textarea
                      id="reason"
                      placeholder="Tell us about your job search needs and how ZapJob could help..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={agreedTerms} 
                      onCheckedChange={(checked) => setAgreedTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="leading-tight">
                      I agree to receive email updates about ZapJob and understand my data will be processed in accordance with the <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                    </Label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full rounded-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Request Access'}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-6 bg-primary/10 rounded-full text-primary mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-4">Request Submitted!</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                Thank you for your interest! We'll review your request and email you when your access is ready.
              </p>
              <Link href="/">
                <Button variant="outline" className="rounded-full">Return to Home</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <footer className="py-6 border-t bg-white dark:bg-gray-950 dark:border-gray-800">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
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
              <span className="text-lg font-bold">ZapJob</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} ZapJob. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}