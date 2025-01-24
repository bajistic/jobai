'use client';

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

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
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const { data: session } = useSession();
  const user = session?.user;

  const startScraping = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageNumber, userId: user?.id }),
      });
      
      if (!response.ok) throw new Error('Failed to start scraping');
      
      toast.success('Scraping started successfully');
    } catch (error) {
      console.error('Error starting scraper:', error);
      toast.error('Failed to start scraping');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <input
          type="number"
          min="1"
          value={pageNumber}
          onChange={(e) => setPageNumber(Number(e.target.value))}
          className="w-20 px-2 py-1 border rounded"
        />
        <Button 
          onClick={startScraping} 
          disabled={isLoading || status?.isRunning}
        >
          {status?.isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scraping Page {status.currentPage}...
            </>
          ) : (
            'Start Scraping'
          )}
        </Button>
      </div>
      
      {status && (
        <div className="text-sm text-muted-foreground">
          <p>Total Jobs: {status.totalJobs}</p>
          {status.lastRun && (
            <p>Last Run: {new Date(status.lastRun).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
} 