import { test, expect } from '@playwright/test';
import { Job, JobStatus } from '../src/lib/types/shared';

// Mock job object that will be used in tests
const mockJob: Job = {
  id: 1,
  title: 'Software Engineer',
  company: 'TechCorp',
  location: 'Zürich',
  description: 'Job description here',
  url: 'https://example.com/job/1',
  status: JobStatus.NEW,
  categories: ['IT', 'Software'],
  isStarred: false,
  isHidden: false,
  published: new Date('2025-02-20')
};

// Setup test for JobCard component interactions
test.describe('JobCard Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page where JobCard is rendered
    // Assuming we have a page that shows job listings
    await page.goto('/jobs');
    
    // Wait for the job cards to be loaded
    await page.waitForSelector('[data-testid="job-card"]');
  });

  test('displays job information correctly', async ({ page }) => {
    // Get the first job card
    const jobCard = page.locator('[data-testid="job-card"]').first();
    
    // Check that the job title is displayed
    await expect(jobCard.locator('text=Software Engineer').first()).toBeVisible();
    
    // Check that the company name is displayed
    await expect(jobCard.locator('text=TechCorp').first()).toBeVisible();
    
    // Check that the location is displayed
    await expect(jobCard.locator('text=Zürich').first()).toBeVisible();
    
    // Check for publication date (in various formats)
    await expect(jobCard.locator('text=/20.02.2025|02.20.2025|2025-02-20/').first()).toBeVisible();
  });

  test('star/unstar functionality works', async ({ page }) => {
    // Get the first job card
    const jobCard = page.locator('[data-testid="job-card"]').first();
    
    // Open the dropdown menu
    await jobCard.locator('button[aria-haspopup="menu"]').click();
    
    // Click on the star option
    await page.locator('text=Star').click();
    
    // Wait for API call to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/jobs') && 
      response.url().includes('/star') && 
      response.status() === 200
    );
    
    // Verify the starred badge is now visible
    await expect(jobCard.locator('text=Starred')).toBeVisible();
    
    // Open the dropdown menu again
    await jobCard.locator('button[aria-haspopup="menu"]').click();
    
    // Click to unstar the job
    await page.locator('text=Unstar').click();
    
    // Wait for API call to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/jobs') && 
      response.url().includes('/star') && 
      response.status() === 200
    );
    
    // Verify the starred badge is no longer visible
    await expect(jobCard.locator('text=Starred')).not.toBeVisible();
  });

  test('hide/unhide functionality works', async ({ page }) => {
    // Get the first job card
    const jobCard = page.locator('[data-testid="job-card"]').first();
    
    // Open the dropdown menu
    await jobCard.locator('button[aria-haspopup="menu"]').click();
    
    // Click on the hide option
    await page.locator('text=Hide').click();
    
    // Wait for API call to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/jobs') && 
      response.url().includes('/hide') && 
      response.status() === 200
    );
    
    // Verify the job card has the opacity class for hidden jobs
    await expect(jobCard).toHaveClass(/opacity-50/);
    
    // Open the dropdown menu again
    await jobCard.locator('button[aria-haspopup="menu"]').click();
    
    // Click to unhide the job
    await page.locator('text=Unhide').click();
    
    // Wait for API call to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/jobs') && 
      response.url().includes('/hide') && 
      response.status() === 200
    );
    
    // Verify the job card doesn't have the opacity class
    await expect(jobCard).not.toHaveClass(/opacity-50/);
  });

  test('notes functionality opens dialog and saves notes', async ({ page }) => {
    // Get the first job card
    const jobCard = page.locator('[data-testid="job-card"]').first();
    
    // Open the dropdown menu
    await jobCard.locator('button[aria-haspopup="menu"]').click();
    
    // Click on the notes option
    await page.locator('text=Notes').click();
    
    // Wait for the notes dialog to appear
    await page.waitForSelector('div[role="dialog"]');
    
    // Type some notes
    await page.locator('textarea').fill('These are test notes for the job');
    
    // Click save
    await page.locator('button:has-text("Save Notes")').click();
    
    // Wait for API call to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/jobs') && 
      response.url().includes('/notes') && 
      response.method === 'PATCH' && 
      response.status() === 200
    );
    
    // Verify the dialog is closed
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();
  });

  test('generate letter dialog opens', async ({ page }) => {
    // Get the first job card
    const jobCard = page.locator('[data-testid="job-card"]').first();
    
    // Open the dropdown menu
    await jobCard.locator('button[aria-haspopup="menu"]').click();
    
    // Click on the generate letter option
    await page.locator('text=Generate Letter').click();
    
    // Wait for the letter generation dialog to appear
    await page.waitForSelector('div[role="dialog"]');
    
    // Verify dialog title contains relevant text
    await expect(page.locator('div[role="dialog"] h2')).toContainText(/letter|cover/i);
  });

  test('job selection works when clicking on the card', async ({ page }) => {
    // Get the first job card
    const jobCard = page.locator('[data-testid="job-card"]').first();
    
    // Click on the job card
    await jobCard.click();
    
    // Verify that the card gets selected (has a ring applied)
    await expect(jobCard).toHaveClass(/ring-2/);
  });
});