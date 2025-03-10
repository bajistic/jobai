'use client';

import { useSession } from 'next-auth/react';
// import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrapingTrigger } from '@/components/ScrapingTrigger';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from 'react';

interface ScrapedJob {
  id: number;
  title: string;
  company: string;
  location: string;
  published: string;
  status: string;
}

export default function ScrapePage() {
  // const { data: session } = useSession();
  useSession();
  const [scrapingHistory, setScrapingHistory] = useState<ScrapedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
    try {
      const response = await fetch('/api/scraper?type=history');
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setScrapingHistory(data.jobs || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
    };
    
    fetchHistory();
  }, []);

  // Uncomment to protect the route - only allow admin users
  /* if (!session?.user?.group || session.user.group !== "admin") {
    redirect('/');
  } */

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Scraper Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrapingTrigger />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {scrapingHistory.map((job) => (
                    <div 
                      key={job.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="font-medium">{job.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {job.company} • {job.location}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(job.published).toLocaleDateString()} • {job.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 