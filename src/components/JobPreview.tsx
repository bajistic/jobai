'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, MoreVertical, BookmarkIcon, EyeOff, FileText, PenSquare, Menu } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Job } from "@/lib/types/shared"
import { JobStatusButton } from "./JobStatusButton"
import { CoverLetterSection } from './CoverLetterSection'
import { useRouter } from 'next/navigation'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'
import { useJobs } from '@/contexts/JobContext'
import { toast } from 'sonner'

interface JobPreviewProps {
  selectedJob: Job | null;
  onBack?: () => void;
}

export default function JobPreview({ selectedJob, onBack }: JobPreviewProps) {
  const router = useRouter();
  const { jobs, setSelectedJobId } = useJobs();
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showLetterDialog, setShowLetterDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localJobState, setLocalJobState] = useState<{
    isStarred?: boolean;
    isHidden?: boolean;
  }>({});
  
  // Find current job index and calculate previous and next indices
  const currentIndex = selectedJob ? jobs.findIndex(job => job.id === selectedJob.id) : -1;
  const hasPrevJob = currentIndex > 0;
  const hasNextJob = currentIndex < jobs.length - 1 && currentIndex !== -1;
  
  // Initialize local state when selected job changes
  useEffect(() => {
    if (selectedJob) {
      setLocalJobState({
        isStarred: selectedJob.isStarred,
        isHidden: selectedJob.isHidden
      });
    }
  }, [selectedJob?.id]);
  
  const handlePrevJob = () => {
    if (hasPrevJob && currentIndex > 0) {
      const prevJob = jobs[currentIndex - 1];
      setSelectedJobId(prevJob.id);
      trackEvent(AnalyticsEvents.BUTTON_CLICKED, {
        component: 'JobPreview',
        action: 'navigate_previous',
        job_id: prevJob.id.toString(),
      });
    }
  };
  
  const handleNextJob = () => {
    if (hasNextJob && currentIndex < jobs.length - 1) {
      const nextJob = jobs[currentIndex + 1];
      setSelectedJobId(nextJob.id);
      trackEvent(AnalyticsEvents.BUTTON_CLICKED, {
        component: 'JobPreview',
        action: 'navigate_next',
        job_id: nextJob.id.toString(),
      });
    }
  };

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
    if (!selectedJob) return;
    
    try {
      switch (action) {
        case 'star':
          // Update local state immediately for UI feedback
          const newStarredState = localJobState.isStarred !== undefined 
            ? !localJobState.isStarred 
            : !selectedJob.isStarred;
            
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
          
          // Make API call
          await fetch(`/api/jobs/${selectedJob.id}/star`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isStarred: newStarredState }),
          });
          
          trackEvent(AnalyticsEvents.JOB_STARRED, {
            job_id: selectedJob.id.toString(),
            action: newStarredState ? 'star' : 'unstar',
          });
          break;
          
        case 'hide':
          // Update local state immediately for UI feedback
          const newHiddenState = localJobState.isHidden !== undefined 
            ? !localJobState.isHidden 
            : !selectedJob.isHidden;
            
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
          
          // Make API call
          await fetch(`/api/jobs/${selectedJob.id}/hide`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isHidden: newHiddenState }),
          });
          
          trackEvent(AnalyticsEvents.JOB_HIDDEN, {
            job_id: selectedJob.id.toString(),
            action: newHiddenState ? 'hide' : 'unhide',
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
      
      // Show error toast
      toast.error(`Failed to ${action} the job`);
      
      // Revert local state on error
      if (action === 'star' || action === 'hide') {
        setLocalJobState(prev => ({
          ...prev,
          [action === 'star' ? 'isStarred' : 'isHidden']: 
            selectedJob[action === 'star' ? 'isStarred' : 'isHidden']
        }));
      }
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

      // Show success toast
      toast.success('Notes saved successfully');

      router.refresh();
      setShowNotesDialog(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      
      // Show error toast
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-4rem)] overflow-y-auto pb-20" style={{WebkitOverflowScrolling: "touch"}}>
        <div className="p-6 pb-24">
          {/* Hide mobile navigation from top since we'll add it to bottom bar */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="w-full pr-2">
                  <h2 className="text-2xl font-bold break-words leading-tight">{selectedJob.title || 'No Title'}</h2>
                  <p className="text-lg text-muted-foreground dark:text-gray-300 mt-1 truncate">{selectedJob.company || 'No Company'}</p>
                  <JobStatusButton jobId={selectedJob.id} currentStatus={selectedJob.status} />
                </CardTitle>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 hidden md:flex flex-shrink-0">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleMenuAction('star')}>
                      <BookmarkIcon className="mr-2 h-4 w-4" />
                      <span>{(localJobState.isStarred !== undefined ? localJobState.isStarred : selectedJob.isStarred) ? 'Unstar' : 'Star'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMenuAction('hide')}>
                      <EyeOff className="mr-2 h-4 w-4" />
                      <span>{(localJobState.isHidden !== undefined ? localJobState.isHidden : selectedJob.isHidden) ? 'Unhide' : 'Hide'}</span>
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
              
              <p className="text-muted-foreground dark:text-gray-300 break-words">
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

      <Dialog open={showLetterDialog} onOpenChange={setShowLetterDialog}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl max-h-[90vh] p-0">
          <CoverLetterSection
            job={selectedJob}
            dialogMode={true}
            open={showLetterDialog}
            onOpenChange={setShowLetterDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
    
    {/* Mobile navigation and actions */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t px-2 py-3 flex items-center z-10">
      <div className="flex w-full justify-between items-center">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onBack}
          className="mr-1 flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        {/* Job navigation */}
        <div className="flex items-center justify-center flex-1 px-1 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevJob}
            disabled={!hasPrevJob}
            aria-label="Previous job"
            className="flex-shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <span className="text-sm text-muted-foreground mx-2 truncate">
            {currentIndex + 1} / {jobs.length}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextJob}
            disabled={!hasNextJob}
            aria-label="Next job"
            className="flex-shrink-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Collapsible actions menu */}
        <Collapsible 
          open={isMenuOpen} 
          onOpenChange={setIsMenuOpen}
          className="relative flex-shrink-0"
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="ml-1"
            >
              <Menu className="h-4 w-4 mr-1" />
              Actions
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="absolute bottom-[calc(100%+10px)] right-0 p-2 bg-background border rounded-md shadow-md min-w-[200px] z-20">
            <div className="flex flex-col space-y-2">
              <Button 
                variant={(localJobState.isStarred !== undefined ? localJobState.isStarred : selectedJob.isStarred) ? "secondary" : "outline"} 
                size="sm"
                className="justify-start"
                onClick={() => {
                  handleMenuAction('star');
                  setIsMenuOpen(false);
                }}
              >
                <BookmarkIcon className="h-4 w-4 mr-2" />
                {(localJobState.isStarred !== undefined ? localJobState.isStarred : selectedJob.isStarred) ? 'Unstar' : 'Star'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="justify-start"
                onClick={() => {
                  handleMenuAction('notes');
                  setIsMenuOpen(false);
                }}
              >
                <PenSquare className="h-4 w-4 mr-2" />
                Notes
              </Button>
              
              <Button 
                variant={selectedJob.cover_letter?.length ? "secondary" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  setShowLetterDialog(true);
                  setIsMenuOpen(false);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                {selectedJob.cover_letter?.length ? 'View Letter' : 'Generate Letter'}
              </Button>
              
              <Button 
                variant={(localJobState.isHidden !== undefined ? localJobState.isHidden : selectedJob.isHidden) ? "secondary" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  handleMenuAction('hide');
                  setIsMenuOpen(false);
                }}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                {(localJobState.isHidden !== undefined ? localJobState.isHidden : selectedJob.isHidden) ? 'Unhide' : 'Hide'}
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
    </>
  )
} 