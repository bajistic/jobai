import { chromium, Page } from 'playwright';
import TurndownService from 'turndown';
import { prisma } from '@/lib/prisma';
import { Job, JobStatus } from '@/lib/types/shared';
import { OpenAIService } from './openai.service';

interface ScrapeStatus {
  isRunning: boolean;
  totalJobs: number;
  currentPage: number;
  lastRun: Date | null;
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
    lastRun: null
  };

  private constructor() {
    this.turndownService = new TurndownService();
    this.openai = OpenAIService.getInstance();
  }

  public static getInstance(): ScraperService {
    if (!ScraperService.instance) {
      ScraperService.instance = new ScraperService();
    }
    return ScraperService.instance;
  }

  getStatus(): ScrapeStatus {
    return this.status;
  }

  async stopScraping() {
    this.status.isRunning = false;
  }

  private async processJob(job: Job) {
    const response = await this.openai.rankJob(job as unknown as Job);
    job.ranking = response.ranking;
    job.canton = response.canton;

    const emoji =
      job.ranking === "bingo"
        ? "🎯"
        : job.ranking === "good"
        ? "🌟"
        : job.ranking === "okay"
        ? "👍"
        : "👎";
    console.log(`${emoji} ${job.title} (${job.published ? job.published.toLocaleDateString() : 'No date'})`);

    await this.saveJob(job);
  }

  private async saveJob(job: Partial<Job>): Promise<void> {
    await prisma.jobs.create({
      data: {
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        description: job.description || '',
        url: job.url || '',
        published: job.published,
        workload: job.workload,
        contract: job.contract,
        canton: job.canton,
        categories: job.categories?.join(','),
        status: 'new',
        ranking: job.ranking,
        address: job.address,
      }
    });
  }

  async startScraping(pageNumber: number) {
    if (this.status.isRunning) {
      // If already running, stop the scraping
      console.log('Scraper is already running, stopping...');
      return;
    }

    this.status.isRunning = true;
    this.status.currentPage = 1;
    this.status.totalJobs = 0;

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

      await this.scrapeJobs(page, pageNumber)

      await browser.close();
    } catch (error) {
      console.error('Scraping failed:', error);
    } finally {
      this.status.isRunning = false;
      this.status.lastRun = new Date();
    }
  } 

  private async scrapeJobs(page: Page, pageNumber: number) {
    const baseUrl = "https://www.jobs.ch/en/vacancies/?employment-type=1&employment-type=5&region=2&term=";
    let hasMorePages = true;
    let duplicateCount = 0;
    const MAX_DUPLICATES = 10; // Stop after finding 5 duplicates in a row
    this.status.currentPage = pageNumber;

    while (hasMorePages && this.status.isRunning) {
      try {
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
              if (duplicateCount >= MAX_DUPLICATES) {
                console.log('Found multiple duplicate jobs in a row, stopping scraper');
                hasMorePages = false;
                this.status.isRunning = false;
                break;
              }
              continue;
            }

            // Reset duplicate counter when we find a new job
            duplicateCount = 0;
            await this.processJob(job);
            this.status.totalJobs++;
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
      id: 0,
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
    // Implementation of job details scraping
    // This would contain the logic from your test file
    // console.log('Job:', job);
    return job; // Placeholder
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