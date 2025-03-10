'use client';

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

interface ScrapeStatus {
  isRunning: boolean;
  totalJobs: number;
  currentPage: number;
  lastRun: string | null;
}

export function ScrapingTrigger() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<ScrapeStatus | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isStopping, setIsStopping] = useState(false);

  const { data: session } = useSession();
  const user = session?.user;

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/scraper?type=status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStatus();
    
    // Set up polling
    const interval = setInterval(fetchStatus, 2500); // Poll every 2.5 seconds for smoother updates
    
    // Clean up
    return () => clearInterval(interval);
  }, []);

  const startScraping = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        toast.error('User session not found');
        return;
      }

      try {
        const response = await fetch('/api/scraper', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            pageNumber, 
            userId: user.id 
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start scraping');
        }
        
        toast.success('Scraping started successfully');
        
        // Track the scraper started event
        trackEvent(AnalyticsEvents.SCRAPER_STARTED, {
          start_page: pageNumber.toString(),
          user_id: user.id
        });
      } catch (fetchError) {
        console.error('Network error when starting scraper:', fetchError);
        toast.error('Network error when starting scraper. Please check your connection.');
        throw fetchError;
      }
      
      // Refresh status immediately
      try {
        await fetchStatus();
      } catch (statusError) {
        console.error('Error refreshing status:', statusError);
      }
    } catch (error) {
      console.error('Error during scraping process:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopScraping = async () => {
    console.log('Stop scraping button clicked');
    setIsStopping(true);
    
    // Set a state flag to prevent multiple stop requests
    window.stoppingInProgress = true;
    
    try {
      // Make the request to stop scraping with a timeout to ensure we get a response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Longer timeout
      
      try {
        console.log('Sending stop request to API...');
        const response = await fetch('/api/scraper/stop', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to stop scraping');
        }
        
        console.log('Stop request successful');
        toast.success('Scraping stopped successfully');
      } catch (fetchError) {
        console.error('Error during stop request:', fetchError);
        
        if (fetchError.name === 'AbortError') {
          console.log('Stop request timed out');
          toast.info('Scraper is stopping, but the request timed out');
        } else {
          toast.error('Network error when stopping scraper');
        }
        
        // Even if the request failed, set the status to stopped so UI updates
        try {
          const forceResponse = await fetch('/api/scraper/stop', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ force: true })
          });
          
          if (forceResponse.ok) {
            console.log('Force stop successful');
          }
        } catch (forceError) {
          console.error('Force stop failed:', forceError);
        }
      }
      
      // Refresh status regardless of success/failure
      try {
        await fetchStatus();
      } catch (statusError) {
        console.error('Error refreshing status:', statusError);
      }
    } finally {
      setIsStopping(false);
      delete window.stoppingInProgress;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-2 items-center">
          <label htmlFor="page-number" className="text-sm font-medium">
            Start Page:
          </label>
          <Input
            id="page-number"
            type="number"
            min="1"
            value={pageNumber}
            onChange={(e) => setPageNumber(Number(e.target.value))}
            className="w-24"
          />
        </div>
        
        {status?.isRunning ? (
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              stopScraping();
            }}
            disabled={isStopping}
            variant="destructive"
            className="flex-shrink-0 cursor-pointer"
          >
            {isStopping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Stop Scraping (Page {status.currentPage})
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={startScraping} 
            disabled={isLoading || isStopping}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              'Start Scraping'
            )}
          </Button>
        )}
      </div>
      
      {status && (
        <div className="p-4 border rounded-md bg-muted/20">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center">
              <span className="font-semibold">Status:</span>{' '}
              {status.isRunning ? 
                <span className="text-green-500 font-semibold ml-1">Active</span> : 
                <span className="text-muted-foreground ml-1">Idle</span>
              }
              
              {/* Reset button for stuck scraper */}
              {status.isRunning && (
                <button 
                  className="ml-2 text-xs text-red-500 hover:text-red-700 underline" 
                  onClick={async () => {
                    if (window.confirm('This will reset the scraper status. Use only if scraping is stuck. Continue?')) {
                      try {
                        // Force reset via API
                        await fetch('/api/scraper/stop', { 
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ force: true })
                        });
                        toast.success('Scraper status reset');
                        // Force refresh status
                        setTimeout(fetchStatus, 500);
                      } catch (e) {
                        console.error('Error resetting scraper:', e);
                        toast.error('Failed to reset scraper');
                      }
                    }
                  }}
                >
                  (reset)
                </button>
              )}
            </div>
            <div>
              <span className="font-semibold">Current Page:</span>{' '}
              <span className={status.isRunning ? "text-primary font-semibold" : "text-muted-foreground"}>
                {status.currentPage}
              </span>
            </div>
            <div>
              <span className="font-semibold">Total Jobs:</span>{' '}
              <span className="text-primary font-semibold">{status.totalJobs}</span>
            </div>
            {status.lastRun && (
              <div>
                <span className="font-semibold">Last Run:</span>{' '}
                <span className="text-muted-foreground">
                  {new Date(status.lastRun).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          {status.isRunning && (
            <div className="mt-3 text-sm text-muted-foreground italic">
              Scraping is running in the background. You can close this page and the process will continue.
            </div>
          )}
        </div>
      )}
    </div>
  );
} 