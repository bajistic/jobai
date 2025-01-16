'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export default function GeneratePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState<string | null>(null)

  const generateLetter = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/jobs/${params.id}/generate`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate cover letter')
      }

      const data = await response.json()
      setCoverLetter(data.coverLetter)
    } catch (err) {
      setError('Failed to generate cover letter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate Cover Letter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          {coverLetter ? (
            <>
              <Textarea
                value={coverLetter}
                readOnly
                className="min-h-[400px]"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(coverLetter)
                  }}
                >
                  Copy to Clipboard
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-muted-foreground text-center">
                Click the button below to generate a cover letter using AI.
              </p>
              <Button
                onClick={generateLetter}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Cover Letter'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 