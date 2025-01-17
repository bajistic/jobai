'use client'

import { Job } from '@/lib/types/shared'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface JobCardProps {
  job: Job
  onUpdate: () => void
  isSelected?: boolean
  onSelect?: (job: Job) => void
}

export function JobCard({ job, onUpdate, isSelected, onSelect }: JobCardProps) {
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [notes, setNotes] = useState(job.notes || '')
  const [isSaving, setIsSaving] = useState(false)

  const toggleHidden = async () => {
    try {
      await fetch(`/api/jobs/${job.id}/hide`, {
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

  const handleMenuAction = async (action: string) => {
    try {
      switch (action) {
        case 'star':
          await fetch(`/api/jobs/${job.id}/star`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isStarred: !job.isStarred }),
          })
          break
        case 'hide':
          await fetch(`/api/jobs/${job.id}/hide`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isHidden: !job.isHidden }),
          })
          break
        case 'notes':
          setShowNotesDialog(true)
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
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">
              {job.status || 'New'}
            </Badge>
            {job.isStarred && (
              <Badge variant="secondary">
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
            <Textarea
              placeholder="Add your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[200px]"
            />
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
    </>
  )
} 