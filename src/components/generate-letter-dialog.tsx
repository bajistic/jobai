'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Job } from '@/lib/types/shared';
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GenerateLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

interface CoverLetter {
  id: number;
  job_id: number;
  content: string;
  docs_url: string;
  created_at: string;
}

export function GenerateLetterDialog({ open, onOpenChange, job }: GenerateLetterDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  useEffect(() => {
    const fetchLatestLetter = async () => {
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
    
    if (open && job) {
      fetchLatestLetter();
    }
  }, [open, job]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Cover Letter</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-2">
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">{progressStatus}</p>
            </div>
          )}
          <div className="flex justify-end py-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !job}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate New Letter
                </>
              )}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[calc(90vh-10rem)] px-6 pb-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : letter ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <a
                  href={letter.docs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Google Docs
                </a>
              </div>
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
      </DialogContent>
    </Dialog>
  );
}