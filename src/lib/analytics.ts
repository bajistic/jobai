// Analytics utilities

/**
 * Track a custom event in Google Analytics
 * @param eventName The name of the event to track
 * @param eventParams Optional parameters to send with the event
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
) => {
  // Only track if gtag is available (client-side and GA is initialized)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams)
  }
}

// Common event names to ensure consistency
export const AnalyticsEvents = {
  // User engagement events
  SIGNUP_STARTED: 'signup_started',
  BETA_REQUESTED: 'beta_requested',
  LOGIN: 'login',
  
  // Job-related events
  JOB_VIEWED: 'job_viewed',
  JOB_STARRED: 'job_starred',
  JOB_APPLIED: 'job_applied',
  JOB_HIDDEN: 'job_hidden',
  JOBS_SEARCHED: 'jobs_searched',
  
  // Feature usage events
  COVER_LETTER_GENERATED: 'cover_letter_generated',
  SCRAPER_STARTED: 'scraper_started',
  FILTER_CHANGED: 'filter_changed',
  RANK_VIEWED: 'rank_viewed',
  
  // UI events
  THEME_CHANGED: 'theme_changed',
  MENU_CLICKED: 'menu_clicked',
  BUTTON_CLICKED: 'button_clicked',
}

// Define interface for window to include gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: Record<string, any>
    ) => void
  }
}