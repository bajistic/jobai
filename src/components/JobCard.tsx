'use client'

import { Job } from '@/lib/types/shared'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, JobTitleLink } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
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
import { CoverLetterSection } from '@/components/CoverLetterSection'
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
  const [localJobState, setLocalJobState] = useState({
    isStarred: job.isStarred,
    isHidden: job.isHidden,
  })
  
  // Update local state when job prop changes
  useEffect(() => {
    setLocalJobState({
      isStarred: job.isStarred,
      isHidden: job.isHidden,
    });
  }, [job.isStarred, job.isHidden])

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

  const handleMenuAction = async (action: string, e?: React.MouseEvent) => {
    // Stop propagation to prevent job selection
    if (e) {
      e.stopPropagation();
    }
    
    try {
      switch (action) {
        case 'star':
          // Update local state immediately for UI feedback
          const newStarredState = !localJobState.isStarred;
          setLocalJobState(prev => ({
            ...prev,
            isStarred: newStarredState
          }));
          
          // Show toast notification
          if (newStarredState) {
            toast.success('Job starred');
          } else {
            toast.success('Job unstarred');
          }
          
          // API call
          await fetch(`/api/jobs/${job.id}/star`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isStarred: newStarredState }),
          })
          
          // Track starring/unstarring event
          trackEvent(AnalyticsEvents.JOB_STARRED, {
            job_id: job.id.toString(),
            action: newStarredState ? 'star' : 'unstar',
          })
          break
          
        case 'hide':
          // Update local state immediately for UI feedback
          const newHiddenState = !localJobState.isHidden;
          setLocalJobState(prev => ({
            ...prev,
            isHidden: newHiddenState
          }));
          
          // Show toast notification
          if (newHiddenState) {
            toast.success('Job hidden');
          } else {
            toast.success('Job unhidden');
          }
          
          // API call
          await fetch(`/api/jobs/${job.id}/hide`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isHidden: newHiddenState }),
          })
          
          // Track hiding/unhiding event
          trackEvent(AnalyticsEvents.JOB_HIDDEN, {
            job_id: job.id.toString(),
            action: newHiddenState ? 'hide' : 'unhide',
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
      console.error('Error handling menu action:', error);
      
      // Show error toast
      toast.error(`Failed to ${action} the job`);
      
      // Revert local state on error
      if (action === 'star' || action === 'hide') {
        setLocalJobState(prev => ({
          ...prev,
          [action === 'star' ? 'isStarred' : 'isHidden']: job[action === 'star' ? 'isStarred' : 'isHidden']
        }));
      }
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

      // Show success toast
      toast.success('Notes saved successfully');

      // Update local state
      onUpdate?.()
      setShowNotesDialog(false)
    } catch (error) {
      console.error('Error saving notes:', error)
      
      // Show error toast
      toast.error('Failed to save notes');
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
              <DropdownMenuItem onClick={(e) => handleMenuAction('star', e)}>
                <BookmarkIcon className="mr-2 h-4 w-4" />
                <span>{localJobState.isStarred ? 'Unstar' : 'Star'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleMenuAction('hide', e)}>
                <EyeOff className="mr-2 h-4 w-4" />
                <span>{localJobState.isHidden ? 'Unhide' : 'Hide'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleMenuAction('notes', e)}>
                <PenSquare className="mr-2 h-4 w-4" />
                <span>Notes</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setShowLetterDialog(true);
              }}>
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
            {localJobState.isStarred && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMenuAction('star', e)
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

      <Dialog open={showLetterDialog} onOpenChange={setShowLetterDialog}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl max-h-[90vh] p-0">
          <CoverLetterSection
            job={job}
            dialogMode={true}
            open={showLetterDialog}
            onOpenChange={setShowLetterDialog}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
