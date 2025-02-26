import { chromium, Page } from 'playwright';
import TurndownService from 'turndown';
import { prisma } from '@/lib/prisma';
import { Job, JobStatus } from '@/lib/types/shared';
import { OpenAIService } from './openai.service';
import { job_ranking } from '@prisma/client';

interface ScrapeStatus {
  isRunning: boolean;
  totalJobs: number;
  currentPage: number;
  lastRun: Date | null;
  forceStop?: boolean;
}

export class ScraperService {
  private static instance: ScraperService;
  private turndownService: TurndownService;
  private openai: OpenAIService;
  private readonly MAX_RETRIES = 3;
  private readonly DELAY_BETWEEN_PAGES = 2000;
  private readonly MAX_DUPLICATES = 10;

  private status: ScrapeStatus = {
    isRunning: false,
    totalJobs: 0,
    currentPage: 0,
    lastRun: null,
    forceStop: false
  };
  
  // Status persistence key for localStorage
  private readonly STATUS_STORAGE_KEY = 'scraper_status';

  private constructor() {
    this.turndownService = new TurndownService();
    this.openai = OpenAIService.getInstance();
    
    // Try to restore status from localStorage if we're in a browser environment
    this.restoreStatus();
  }
  
  // Save status to localStorage
  private saveStatus(): void {
    if (typeof window !== 'undefined') {
      try {
        const statusCopy = {
          ...this.status,
          lastRun: this.status.lastRun ? this.status.lastRun.toISOString() : null
        };
        localStorage.setItem(this.STATUS_STORAGE_KEY, JSON.stringify(statusCopy));
        console.log('Scraper status saved to localStorage');
      } catch (error) {
        console.error('Failed to save scraper status:', error);
      }
    }
  }
  
  // Restore status from localStorage
  private restoreStatus(): void {
    if (typeof window !== 'undefined') {
      try {
        const savedStatus = localStorage.getItem(this.STATUS_STORAGE_KEY);
        if (savedStatus) {
          const parsedStatus = JSON.parse(savedStatus);
          // Convert lastRun string back to Date if it exists
          if (parsedStatus.lastRun) {
            parsedStatus.lastRun = new Date(parsedStatus.lastRun);
          }
          
          console.log('Restored scraper status from localStorage:', parsedStatus);
          
          // If the saved status shows running but it's been more than 30 minutes, 
          // assume it crashed and reset isRunning to false
          if (parsedStatus.isRunning && parsedStatus.lastRun) {
            const thirtyMinutesAgo = new Date();
            thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
            
            if (new Date(parsedStatus.lastRun) < thirtyMinutesAgo) {
              console.log('Scraper status was running but appears stale (>30 min old), resetting to idle');
              parsedStatus.isRunning = false;
              parsedStatus.lastRun = new Date();
            }
          }
          
          this.status = { ...this.status, ...parsedStatus };
        }
      } catch (error) {
        console.error('Failed to restore scraper status:', error);
      }
    }
  }

  public static getInstance(): ScraperService {
    if (!ScraperService.instance) {
      ScraperService.instance = new ScraperService();
    }
    return ScraperService.instance;
  }

  getStatus(): ScrapeStatus {
    // Create a deep copy to ensure we don't return a reference to the internal status
    const status = {
      isRunning: this.status.isRunning,
      totalJobs: this.status.totalJobs,
      currentPage: this.status.currentPage,
      lastRun: this.status.lastRun ? new Date(this.status.lastRun).toISOString() : null
    };
    
    return status;
  }
  
  // Method to directly update the status (used for force reset)
  setStatus(status: Partial<ScrapeStatus>): void {
    if (status.isRunning !== undefined) this.status.isRunning = status.isRunning;
    if (status.currentPage !== undefined) this.status.currentPage = status.currentPage;
    if (status.totalJobs !== undefined) this.status.totalJobs = status.totalJobs;
    if (status.lastRun !== undefined) this.status.lastRun = new Date(status.lastRun);
    
    // Save the updated status to localStorage
    this.saveStatus();
  }

  async stopScraping() {
    console.log('Stopping scraper...');
    
    // Set flag to stop scraping
    this.status.isRunning = false;
    
    // Force process cleanup if possible
    try {
      // This will trigger immediate stopping when the loop checks the running condition
      this.status.forceStop = true;
      
      console.log('Scraper stop flag set. It will stop on the next loop iteration.');
      
      // Set last run time
      this.status.lastRun = new Date();
    } catch (error) {
      console.error('Error during scraper stop:', error);
    }
    
    return { success: true, message: 'Scraper stopping...' };
  }

  // Method to prepare assistant and ensure it exists for the scraping session
  private async prepareAssistant(userId: string) {
    try {
      // Check if assistant exists for this user
      const assistant = await prisma.userAssistant.findFirst({
        where: {
          userId,
          assistantName: `JobRanker_${userId}`
        }
      });
      
      if (!assistant) {
        console.log(`No assistant found for user ${userId}, creating new one...`);
        // Create a new assistant
        const assistantId = await this.openai.createJobRankingAssistant(userId);
        return { assistantId, assistantName: `JobRanker_${userId}` };
      }
      
      // Verify the assistant exists in OpenAI
      try {
        await this.openai.beta.assistants.retrieve(assistant.assistantId);
        console.log(`Using existing assistant: ${assistant.assistantName} with ID: ${assistant.assistantId}`);
        return assistant;
      } catch (error) {
        console.error(`Assistant ${assistant.assistantId} not found in OpenAI, creating new one...`);
        // Create a new assistant
        const newAssistantId = await this.openai.createJobRankingAssistant(userId);
        
        // Update the assistant ID in the database
        await prisma.userAssistant.update({
          where: { id: assistant.id },
          data: { assistantId: newAssistantId }
        });
        
        return { ...assistant, assistantId: newAssistantId };
      }
    } catch (error) {
      console.error('Error preparing assistant:', error);
      return null;
    }
  }
  
  private async processJob(job: Job, userId: string, preparedAssistant?: any) {
    try {
      // Rank the job using OpenAI
      let response;
      if (preparedAssistant) {
        // Use the prepared assistant for faster processing
        response = await this.openai.rankJobWithAssistant(job, preparedAssistant.assistantId);
      } else {
        // Fall back to normal ranking if no prepared assistant
        response = await this.openai.rankJob(job, userId);
      }
      
      job.ranking = response.ranking;
      job.canton = response.canton;

      // Visual feedback in the console based on ranking
      const emoji =
        job.ranking === "bingo"
          ? "🎯"
          : job.ranking === "good"
          ? "🌟"
          : job.ranking === "okay"
          ? "👍"
          : "👎";
      console.log(`${emoji} ${job.title} (${job.published ? job.published.toLocaleDateString() : 'No date'})`);

      // Save the job with ranking data
      await this.saveJob(job);
      
      // Create user-specific job preference with ranking
      await this.createJobPreference(job, userId);
    } catch (error) {
      console.error(`Error processing job "${job.title}":`, error);
      // Save job anyway but with default "bad" ranking
      await this.saveJob(job);
    }
  }

  private async saveJob(job: Partial<Job>): Promise<number> {
    try {
      // First check if a job with this URL already exists
      if (job.url) {
        const existingJob = await prisma.jobs.findUnique({
          where: { url: job.url }
        });
        
        if (existingJob) {
          // Update the existing job with new information
          const updatedJob = await prisma.jobs.update({
            where: { id: existingJob.id },
            data: {
              // Only update fields if they're provided
              ...(job.title && { title: job.title }),
              ...(job.company && { company: job.company }),
              ...(job.location && { location: job.location }),
              ...(job.description && { description: job.description }),
              ...(job.published && { published: job.published }),
              ...(job.workload && { workload: job.workload }),
              ...(job.contract && { contract: job.contract }),
              ...(job.canton && { canton: job.canton }),
              ...(job.categories && { categories: job.categories.join(',') }),
              ...(job.address && { address: job.address }),
              ...(job.ranking && { ranking: job.ranking }),
            }
          });
          return updatedJob.id;
        }
      }
      
      // If no existing job found, create a new one
      const savedJob = await prisma.jobs.create({
        data: {
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          description: job.description || '',
          url: job.url || '',
          published: job.published,
          workload: job.workload,
          contract: job.contract,
          canton: job.canton || 'N/A',
          categories: job.categories?.join(','),
          status: 'new',
          address: job.address,
          ranking: job.ranking || 'bad', // Include ranking in the saved job
        }
      });
      
      return savedJob.id;
    } catch (error) {
      console.error(`Error saving job "${job.title}":`, error);
      // If it's a unique constraint error, try to find the existing job and return its ID
      if (error.code === 'P2002' && job.url) {
        const existingJob = await prisma.jobs.findUnique({
          where: { url: job.url }
        });
        if (existingJob) {
          console.log(`Found existing job with URL ${job.url}, ID: ${existingJob.id}`);
          return existingJob.id;
        }
      }
      throw error;
    }
  }

  private async createJobPreference(job: Job, userId: string): Promise<void> {
    if (!job.id) {
      console.warn('Job ID is missing, cannot create job preference');
      return;
    }
    
    // Create or update job preference for this user
    await prisma.job_preferences.upsert({
      where: {
        job_id_user_id: {
          job_id: job.id,
          user_id: userId,
        },
      },
      create: {
        job_id: job.id,
        user_id: userId,
        ranking: job.ranking,
        status: 'new',
      },
      update: {
        ranking: job.ranking,
      },
    });
  }

  async startScraping(pageNumber: number, userId: string) {
    if (this.status.isRunning) {
      // If already running, stop the scraping
      console.log('Scraper is already running, stopping...');
      return;
    }

    this.status.isRunning = true;
    this.status.currentPage = 1;
    this.status.totalJobs = 0;
    
    // Save the updated status to localStorage
    this.saveStatus();

    try {
      const browser = await chromium.launch({ 
        headless: true,
        args: [
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-sandbox',
        ],
        timeout: 30000, // Browser launch timeout in ms
      });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        javaScriptEnabled: true,
      });
      const page = await context.newPage();

      await this.scrapeJobs(page, pageNumber, userId);
      
      // Make sure to close the browser even if scraping was stopped
      console.log('Closing browser...');
      await browser.close();
      console.log('Browser closed');
    } catch (error) {
      console.error('Scraping failed:', error);
    } finally {
      this.status.isRunning = false;
      this.status.lastRun = new Date();
      
      // Save final status to localStorage
      this.saveStatus();
    }
  } 

  private async scrapeJobs(page: Page, pageNumber: number, userId: string) {
    // Reset force stop flag
    this.status.forceStop = false;
    
    // Prepare OpenAI assistant
    console.log('Preparing OpenAI assistant for batch processing...');
    const assistant = await this.prepareAssistant(userId);
    if (!assistant) {
      console.error('Failed to prepare assistant, aborting scrape');
      return;
    }
    
    // Start scraping
    const baseUrl = "https://www.jobs.ch/en/vacancies/?employment-type=1&employment-type=5&region=2&term=";
    let hasMorePages = true;
    let duplicateCount = 0;
    this.status.currentPage = pageNumber;

    while (hasMorePages && this.status.isRunning && !this.status.forceStop) {
      try {
        // Make sure to update the status object with current page number
        this.status.currentPage = this.status.currentPage;
        console.log('Scraping page:', this.status.currentPage);
        const pageUrl = `${baseUrl}&page=${this.status.currentPage}`;
        await page.goto(pageUrl, { waitUntil: "load" });

        const searchedJobs = page.locator('[data-feat="searched_jobs"]');
        const jobCardLocators = await searchedJobs.all();

        // Check if we have any jobs on this page
        if (jobCardLocators.length === 0) {
          hasMorePages = false;
          continue;
        }

        for (const jobCardLocator of jobCardLocators) {
          const job = await this.scrapeJobDetails(page, jobCardLocator);
          if (job) {
            // Check if job already exists in database
            const exists = await prisma.jobs.findUnique({ where: { url: job.url } });
            if (exists) {
              console.log('Skipping duplicate job:', job.title);
              duplicateCount++;

              // Stop if we've found too many duplicates in a row
              if (duplicateCount >= this.MAX_DUPLICATES) {
                console.log('Found multiple duplicate jobs in a row, stopping scraper');
                hasMorePages = false;
                this.status.isRunning = false;
                break;
              }
              continue;
            }

            // Reset duplicate counter when we find a new job
            duplicateCount = 0;
            
            // Save the job first to get an ID
            const jobId = await this.saveJob(job);
            job.id = jobId;
            
            // Now process the job with ranking
            await this.processJob(job, userId, assistant);
            this.status.totalJobs++;
            
            // Update localStorage with latest job count
            this.saveStatus();
            if (!this.status.isRunning) {
              console.log('Scraper is not running, stopping...');
              break;
            }
          }
        }

        this.status.currentPage++;

      } catch (error) {
        console.error('Error scraping jobs:', error);
        hasMorePages = false;
      }
    }
  }

  private async scrapeJobDetails(page: Page, jobCardLocator: any): Promise<Job | null> {
    const innerTexts = await jobCardLocator.allInnerTexts();
    const lines = innerTexts
      .join("\n")
      .split("\n")
      .filter((line: string) => line.trim() !== "");

    const linesToRemove = ["Quick apply", "Place of work:", "Published:", "Workload", "Contract type", "New"];
    const filteredLines = lines.filter((line: string) => 
      !linesToRemove.some((removeText: string) => line.includes(removeText))
    );

    // Remove both the salary line and the line after it
    for (let i = 0; i < filteredLines.length - 1; i++) {
      if (filteredLines[i].toLowerCase().includes('salary')) {
        filteredLines.splice(i, 2); // Remove 2 lines starting at index i
        i--; // Adjust index since we removed elements
      }
    }

    // console.log('Lines:', filteredLines);
    const jobLink = jobCardLocator.locator('[data-cy="job-link"]'); // Get URL
    const jobUrl = await jobLink.getAttribute("href");

    await jobLink.click();
    await page.waitForLoadState("load");

    const publishedStr = filteredLines[0].replace("Published: ", "").trim();
    const publishedDate = this.parsePublishedDate(publishedStr);

    const jobTitle = page.locator('[data-cy="vacancy-title"]');
    const jobTitleText = await jobTitle.textContent();

    const jobContentLocator = page.locator('[data-cy="vacancy-description"]');
    const jobAddressLocator = page.locator('[data-cy="info-location-link"]')
    const jobAddress = await jobAddressLocator.allInnerTexts();

    const jobMeta = page.locator('[data-cy="vacancy-meta"]');
    const jobCategories = await jobMeta.locator('a').allInnerTexts();

    const jobContentHTML = await jobContentLocator.first().innerHTML();
    const jobContentMD = this.turndownService.turndown(jobContentHTML);

    const job: Job = {
      id: 0, // This will be updated after saving
      published: publishedDate,
      title: filteredLines[1]?.trim() || "N/A",
      location: filteredLines[2]?.trim() || "N/A",
      address: jobAddress.join(', ') || "N/A",
      canton: "N/A",
      workload: filteredLines[3]?.trim() || "N/A",
      contract: filteredLines[4]?.trim() || "N/A",
      company: filteredLines[5]?.trim() || "N/A",
      url: `https://www.jobs.ch${jobUrl}`,
      description: jobContentMD,
      ranking: "bad", // Default ranking
      categories: jobCategories,
      status: JobStatus.NEW,
    };
    
    return job;
  }

  private parsePublishedDate(dateStr: string): Date {
    // Handle "yesterday"
    if (dateStr.toLowerCase() === 'yesterday') {
      const now = new Date();
      return new Date(now.setDate(now.getDate() - 1));
    }

    // Check if the string contains "ago"
    if (dateStr.includes('ago')) {
      const now = new Date();
      const [amount, unit] = dateStr.split(' ');

      if (unit.includes('minute')) {
        return new Date(now.getTime() - parseInt(amount) * 60 * 1000);
      } else if (unit.includes('hour')) {
        return new Date(now.getTime() - parseInt(amount) * 60 * 60 * 1000);
      } else if (unit.includes('day')) {
        return new Date(now.getTime() - parseInt(amount) * 24 * 60 * 60 * 1000);
      }
    }

    // Fall back to regular date parsing if not a relative time
    return new Date(dateStr);
  }
} 