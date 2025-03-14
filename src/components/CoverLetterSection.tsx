'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Job } from '@/lib/types/shared';
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CoverLetterSectionProps {
  job: Job;
  dialogMode?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface CoverLetter {
  id: number;
  job_id: number;
  content: string;
  docs_url: string;
  created_at: string;
}

export function CoverLetterSection({
  job,
  dialogMode = false,
  open = false,
  onOpenChange
}: CoverLetterSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setDialogOpen(newOpen);
    }
  };

  const currentOpen = onOpenChange ? open : dialogOpen;

  useEffect(() => {
    const fetchLetter = async () => {
      if (!job) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/jobs/${job.id}/cover-letter`);
        const data = await response.json();

        if (data.letter) {
          setLetter(data.letter);
        }
      } catch (error) {
        console.error('Error fetching letter:', error);
        toast.error('Failed to load cover letter');
      } finally {
        setIsLoading(false);
      }
    };

    if ((dialogMode && currentOpen) || (!dialogMode && job.cover_letter)) {
      fetchLetter();
    }
  }, [dialogMode, currentOpen, job]);

  const fetchLatestLetter = async () => {
    if (!job) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/cover-letter`);
      const data = await response.json();

      if (data.success) {
        setLetter(data.letter);
      }
    } catch (error) {
      console.error('Failed to fetch letter:', error);
      toast.error('Failed to load cover letter');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!job) return;

    setIsGenerating(true);
    setProgress(0);
    try {
      const eventSource = new EventSource(`/api/jobs/${job.id}/cover-letter/stream`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setProgress(data.progress);
        setProgressStatus(data.status);
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      const response = await fetch(`/api/jobs/${job.id}/cover-letter`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        await fetchLatestLetter();
        toast.success('Cover letter generated successfully!');
      } else {
        toast.error('Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Failed to generate:', error);
      toast.error('Failed to generate cover letter');
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressStatus('');
    }
  };

  // Inline cover letter display
  if (!dialogMode) {
    if (job.cover_letter) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-semibold">Cover Letter</h2>
            <div className="grid grid-cols-2 gap-1 w-60">
              <Button
                variant="outline"
                size="xs"
                onClick={() => job.cover_letter[0].docs_url && window.open(job.cover_letter[0].docs_url, '_blank')}
                disabled={!job.cover_letter[0].docs_url}
                className="w-full h-7"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Open in Docs
              </Button>
              <Button
                size="xs"
                onClick={() => handleOpenChange(true)}
                className="w-full h-7"
              >
                <FileText className="mr-1 h-3 w-3" />
                Generate
              </Button>
            </div>
          </div>
          <div className="h-[400px] md:h-[600px] w-full">
            <ScrollArea className="h-full w-full">
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap p-1">
                {job.cover_letter[0].content}
              </div>
            </ScrollArea>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-1">Cover Letter</h2>
          <div className="flex flex-col items-start justify-center min-h-[120px]">
            <p className="text-gray-600 dark:text-gray-400 mb-2">No cover letter generated yet.</p>
            <Button
              onClick={() => handleOpenChange(true)}
              size="sm"
              className="h-8"
            >
              <FileText className="mr-1 h-4 w-4" />
              Generate Cover Letter
            </Button>
          </div>
        </div>

        <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl max-h-[90vh] p-0">
            <CoverLetterSection
              job={job}
              dialogMode={true}
              open={currentOpen}
              onOpenChange={handleOpenChange}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Dialog mode rendering
  return (
    <>
      <DialogHeader className="px-6 pt-3 pb-0">
        <DialogTitle className="text-lg">Cover Letter</DialogTitle>
      </DialogHeader>

      <div className="px-6 py-1">
        {isGenerating && (
          <div className="space-y-1">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground text-center">{progressStatus}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-1 w-full">
          <Button
            variant="outline"
            size="xs"
            onClick={() => letter?.docs_url && window.open(letter.docs_url, '_blank')}
            disabled={!letter?.docs_url}
            className="w-full h-7"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Open in Docs
          </Button>
          <Button
            size="xs"
            onClick={handleGenerate}
            disabled={isGenerating || !job}
            className="w-full h-7"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-1 h-3 w-3" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 max-h-[calc(90vh-6rem)] px-6 pb-6">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          </div>
        ) : letter ? (
          <div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {letter.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">
                {letter.created_at ? new Date(letter.created_at).toLocaleString() : 'Date not available'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No cover letter generated yet
          </div>
        )}
      </ScrollArea>
    </>
  );
}
