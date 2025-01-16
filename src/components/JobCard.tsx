'use client'

import { Job } from '@/lib/types/shared'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, BookmarkIcon, EyeOff, FileText, PenSquare } from 'lucide-react'
import { cn } from "@/lib/utils"

interface JobCardProps {
  job: Job
  onUpdate: () => void
  isSelected?: boolean
  onSelect?: (job: Job) => void
}

export function JobCard({ job, onUpdate, isSelected, onSelect }: JobCardProps) {

  const toggleHidden = async () => {
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !job.isHidden }),
      })
      onUpdate()
    } catch (error) {
      console.error('Error updating job:', error)
    }
  }

  const toggleStarred = async () => {
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !job.isStarred }),
      })
      onUpdate()
    } catch (error) {
      console.error('Error updating job:', error)
    }
  }

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'star':
        toggleStarred()
        break
      case 'hide':
        toggleHidden()
        break
      case 'notes':
        console.log('Notes action for job:', job.id)
        break
      default:
        console.log(`Action ${action} for job:`, job.id)
    }
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:bg-accent/50 transition-colors",
        job.isHidden && "opacity-50",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={() => onSelect?.(job)}
    >
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleMenuAction('star')}>
              <BookmarkIcon className="mr-2 h-4 w-4" />
              <span>{job.isStarred ? 'Unstar' : 'Star'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMenuAction('hide')}>
              <EyeOff className="mr-2 h-4 w-4" />
              <span>{job.isHidden ? 'Unhide' : 'Hide'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMenuAction('notes')}>
              <PenSquare className="mr-2 h-4 w-4" />
              <span>Notes</span>
            </DropdownMenuItem>
            {!job.coverLetter && (
              <DropdownMenuItem asChild>
                <Link href={`/jobs/${job.id}/generate`}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Generate Letter</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{job.company}</p>
        <p className="text-sm text-muted-foreground">{job.location}</p>
        <Badge variant="secondary" className="mt-2">
          {job.status || 'New'}
        </Badge>
      </CardContent>
    </Card>
  )
} 