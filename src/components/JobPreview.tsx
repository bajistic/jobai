'use client'

import { useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronLeft, MoreVertical, BookmarkIcon, EyeOff, FileText, PenSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Job } from "@/lib/types/shared"
import { JobStatusButton } from "./JobStatusButton"
import { GenerateLetterDialog } from './generate-letter-dialog'
import { useRouter } from 'next/navigation'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

interface JobPreviewProps {
  selectedJob: Job | null;
  onBack?: () => void;
}

export default function JobPreview({ selectedJob, onBack }: JobPreviewProps) {
  const router = useRouter();
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showLetterDialog, setShowLetterDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!selectedJob) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground dark:text-gray-300">Select a job to view details</p>
      </div>
    )
  }

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/notes`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data.notes || '');
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuAction = async (action: string) => {
    try {
      switch (action) {
        case 'star':
          await fetch(`/api/jobs/${selectedJob.id}/star`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isStarred: !selectedJob.isStarred }),
          });
          trackEvent(AnalyticsEvents.JOB_STARRED, {
            job_id: selectedJob.id.toString(),
            action: !selectedJob.isStarred ? 'star' : 'unstar',
          });
          break;
        case 'hide':
          await fetch(`/api/jobs/${selectedJob.id}/hide`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isHidden: !selectedJob.isHidden }),
          });
          trackEvent(AnalyticsEvents.JOB_HIDDEN, {
            job_id: selectedJob.id.toString(),
            action: !selectedJob.isHidden ? 'hide' : 'unhide',
          });
          break;
        case 'notes':
          setShowNotesDialog(true);
          await fetchNotes();
          trackEvent(AnalyticsEvents.BUTTON_CLICKED, {
            component: 'JobPreview',
            action: 'open_notes',
            job_id: selectedJob.id.toString(),
          });
          break;
      }
      // Refresh the job list
      router.refresh();
    } catch (error) {
      console.error('Error handling menu action:', error);
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      router.refresh();
      setShowNotesDialog(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-6 pb-20">
          <Button 
            variant="ghost" 
            className="lg:hidden mb-4" 
            onClick={onBack}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to list
          </Button>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>
                  <h2 className="text-2xl font-bold">{selectedJob.title || 'No Title'}</h2>
                  <p className="text-lg text-muted-foreground dark:text-gray-300 mt-1">{selectedJob.company || 'No Company'}</p>
                  <JobStatusButton jobId={selectedJob.id} currentStatus={selectedJob.status} />
                </CardTitle>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 hidden md:flex">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleMenuAction('star')}>
                      <BookmarkIcon className="mr-2 h-4 w-4" />
                      <span>{selectedJob.isStarred ? 'Unstar' : 'Star'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMenuAction('hide')}>
                      <EyeOff className="mr-2 h-4 w-4" />
                      <span>{selectedJob.isHidden ? 'Unhide' : 'Hide'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMenuAction('notes')}>
                      <PenSquare className="mr-2 h-4 w-4" />
                      <span>Notes</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowLetterDialog(true)}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>{selectedJob.cover_letter?.length ? 'View Letter' : 'Generate Letter'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <p className="text-muted-foreground dark:text-gray-300">
                {selectedJob.location || 'No Location'} • {selectedJob.status || 'New'}
              </p>
              <Button size="lg" className="mt-4">Apply Now</Button>
            </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Job Description</h3>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>
                  {selectedJob.description || 'No description available.'}
                </ReactMarkdown>
              </div>
            </div>
            <Separator />
            {selectedJob.url && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Job URL</h3>
                <a href={selectedJob.url} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-500 dark:text-blue-400 hover:underline">
                  View Original Posting
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Notes for {selectedJob.title}</DialogTitle>
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
        job={selectedJob}
      />
    </ScrollArea>
    
    {/* Mobile action buttons */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex justify-around">
      <Button 
        variant={selectedJob.isStarred ? "secondary" : "outline"} 
        size="sm"
        className="flex-1 mx-1"
        onClick={() => handleMenuAction('star')}
      >
        <BookmarkIcon className="h-4 w-4 mr-2" />
        {selectedJob.isStarred ? 'Starred' : 'Star'}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        className="flex-1 mx-1"
        onClick={() => handleMenuAction('notes')}
      >
        <PenSquare className="h-4 w-4 mr-2" />
        Notes
      </Button>
      
      <Button 
        variant={selectedJob.cover_letter?.length ? "secondary" : "outline"}
        size="sm"
        className="flex-1 mx-1"
        onClick={() => setShowLetterDialog(true)}
      >
        <FileText className="h-4 w-4 mr-2" />
        Letter
      </Button>
      
      <Button 
        variant={selectedJob.isHidden ? "secondary" : "outline"}
        size="sm"
        className="flex-1 mx-1"
        onClick={() => handleMenuAction('hide')}
      >
        <EyeOff className="h-4 w-4 mr-2" />
        {selectedJob.isHidden ? 'Hidden' : 'Hide'}
      </Button>
    </div>
    </>
  )
} 