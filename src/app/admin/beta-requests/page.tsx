'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface BetaRequest {
  id: string
  name: string
  email: string
  reason: string
  requestDate: string
  status: 'pending' | 'approved' | 'rejected'
}

// Mock data - in a real app this would come from an API
const mockBetaRequests: BetaRequest[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    reason: 'I am currently job hunting and would love to try out this tool to streamline my search process.',
    requestDate: '2025-03-10T12:00:00Z',
    status: 'pending'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    reason: 'Looking to change careers and need assistance with job matching.',
    requestDate: '2025-03-09T14:30:00Z',
    status: 'approved'
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert@example.com',
    reason: 'I work in HR and would like to see how AI can help with the job search process.',
    requestDate: '2025-03-08T09:15:00Z',
    status: 'rejected'
  }
]

export default function BetaRequestsAdminPage() {
  const { data: session, status } = useSession()
  const [betaRequests, setBetaRequests] = useState<BetaRequest[]>([])
  
  useEffect(() => {
    // Fetch actual beta requests
    const fetchBetaRequests = async () => {
      try {
        const response = await fetch('/api/admin/beta-requests')
        if (response.ok) {
          const data = await response.json()
          setBetaRequests(data)
        } else {
          console.error('Failed to fetch beta requests')
          // Fall back to mock data in case of error
          setBetaRequests(mockBetaRequests)
        }
      } catch (error) {
        console.error('Error fetching beta requests:', error)
        // Fall back to mock data in case of error
        setBetaRequests(mockBetaRequests)
      }
    }
    
    fetchBetaRequests()
  }, [])
  
  // This would typically check for admin status
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  const updateRequestStatus = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/admin/beta-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      })
      
      if (response.ok) {
        // Update the UI state with the new status
        setBetaRequests(prev => 
          prev.map(request => 
            request.id === id ? { ...request, status } : request
          )
        )
        toast.success(`Request ${status === 'approved' ? 'approved' : 'rejected'}`)
      } else {
        toast.error('Failed to update request status')
      }
    } catch (error) {
      console.error('Error updating request status:', error)
      toast.error('An error occurred')
    }
  }
  
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Beta Access Requests</h1>
        
        <div className="grid gap-4">
          {betaRequests.map(request => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 flex flex-row items-start justify-between p-4">
                <div>
                  <div className="font-bold">{request.name}</div>
                  <div className="text-sm text-gray-500">{request.email}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(request.requestDate).toLocaleDateString()} at {new Date(request.requestDate).toLocaleTimeString()}
                  </div>
                </div>
                <Badge 
                  className={
                    request.status === 'approved' ? 'bg-green-500' :
                    request.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                  }
                >
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </CardHeader>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Reason for access:</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{request.reason}</p>
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => updateRequestStatus(request.id, 'rejected')}
                    disabled={request.status === 'rejected'}
                  >
                    Reject
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => updateRequestStatus(request.id, 'approved')}
                    disabled={request.status === 'approved'}
                  >
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {betaRequests.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500">No beta access requests yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}