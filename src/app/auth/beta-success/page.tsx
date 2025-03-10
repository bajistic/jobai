'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"

export default function BetaSuccessPage() {
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
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
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
                className="text-primary"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Beta Request Received!</h1>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-500 dark:text-gray-400">
              Thank you for your interest in ZapJob! We've received your beta access request.
            </p>
            <div className="rounded-lg bg-primary/5 p-4 dark:bg-primary/10">
              <h3 className="font-medium mb-1">What happens next?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We'll review your request and notify you via email when your access is granted. This usually takes 1-2 business days.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <Link href="/">
              <Button variant="outline" className="rounded-full">
                Return to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}