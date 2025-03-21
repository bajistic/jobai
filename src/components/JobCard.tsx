'use client'

import { Job } from '@/lib/types/shared'
import { useState } from 'react'
import { Card, CardContent, CardHeader, JobTitleLink } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, BookmarkIcon, EyeOff, FileText, PenSquare } from 'lucide-react'
import { cn } from "@/lib/utils"
import { GenerateLetterDialog } from '@/components/generate-letter-dialog'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

interface JobCardProps {
  job: Job
  onUpdate: () => void
  isSelected?: boolean
  onSelect?: (job: Job) => void
}

export function JobCard({ job, onUpdate, isSelected, onSelect }: JobCardProps) {
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [showLetterDialog, setShowLetterDialog] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/notes`)
      if (!response.ok) throw new Error('Failed to fetch notes')
      const data = await response.json()
      setNotes(data.notes || '')
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMenuAction = async (action: string) => {
    try {
      switch (action) {
        case 'star':
          await fetch(`/api/jobs/${job.id}/star`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isStarred: !job.isStarred }),
          })
          // Track starring/unstarring event
          trackEvent(AnalyticsEvents.JOB_STARRED, {
            job_id: job.id.toString(),
            action: !job.isStarred ? 'star' : 'unstar',
          })
          break
        case 'hide':
          await fetch(`/api/jobs/${job.id}/hide`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isHidden: !job.isHidden }),
          })
          // Track hiding/unhiding event
          trackEvent(AnalyticsEvents.JOB_HIDDEN, {
            job_id: job.id.toString(),
            action: !job.isHidden ? 'hide' : 'unhide',
          })
          break
        case 'notes':
          setShowNotesDialog(true)
          await fetchNotes()
          // Track notes opened event
          trackEvent(AnalyticsEvents.BUTTON_CLICKED, {
            component: 'JobCard',
            action: 'open_notes',
            job_id: job.id.toString(),
          })
          break
      }
      // Refresh the job list
      onUpdate?.()
    } catch (error) {
      console.error('Error handling menu action:', error)
    }
  }

  const handleSaveNotes = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      // Update local state
      onUpdate?.()
      setShowNotesDialog(false)
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer hover:bg-accent/50 transition-colors",
          job.isHidden && "opacity-50",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={() => {
          onSelect?.(job)
          // Track job card clicked event
          trackEvent(AnalyticsEvents.JOB_VIEWED, {
            job_id: job.id.toString(),
            job_title: job.title || 'Untitled',
            company: job.company || 'Unknown',
          })
        }}
      >
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <JobTitleLink className="text-lg font-semibold">
            {job.title}
            {job.status && (
              <Badge variant="secondary" className="ml-2">
                {job.status}
              </Badge>
            )}
          </JobTitleLink>
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
              <DropdownMenuItem onClick={() => setShowLetterDialog(true)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Generate Letter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">{job.company}</p>
          <p className="text-sm text-muted-foreground dark:text-gray-300">{job.location}</p>
          <div className="flex gap-2 mt-2">
            <p className="text-sm text-muted-foreground dark:text-gray-300">
              {job.published ? new Date(job.published).toLocaleDateString('de-CH', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }) : 'No date'}
            </p>
            {job.isStarred && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMenuAction('star')
                }}
              >
                <BookmarkIcon className="h-3 w-3 mr-1" />
                Starred
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Notes for {job.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isLoading ? (
              <div>Loading notes...</div>
            ) : (
              <Textarea
                placeholder="Add your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[200px]"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotesDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GenerateLetterDialog
        open={showLetterDialog}
        onOpenChange={setShowLetterDialog}
        job={job}
      />
    </>
  )
}
