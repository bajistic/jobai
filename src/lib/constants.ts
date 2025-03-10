// Theme Colors
export const THEME_COLORS = {
  light: {
    // Brand Colors
    brand: {
      primary: "hsl(230, 80%, 50%)",      // Bright blue
      secondary: "hsl(200, 75%, 55%)",    // Light blue
      tertiary: "hsl(250, 70%, 60%)",     // Purple
      accent: "hsl(320, 75%, 60%)",       // Magenta
    },
    // UI Colors
    ui: {
      background: "hsl(0, 0%, 100%)",      // White
      foreground: "hsl(240, 10%, 10%)",    // Near black
      card: "hsl(0, 0%, 100%)",            // White
      border: "hsl(240, 5%, 90%)",         // Light gray
      hover: "hsl(240, 5%, 95%)",          // Lighter gray
    },
    // Status Colors
    status: {
      success: "hsl(145, 70%, 45%)",       // Green
      warning: "hsl(40, 90%, 55%)",        // Yellow
      error: "hsl(0, 80%, 60%)",           // Red
      info: "hsl(210, 80%, 60%)",          // Blue
    },
    // Text Colors
    text: {
      primary: "hsl(240, 10%, 10%)",        // Near black
      secondary: "hsl(240, 5%, 40%)",       // Gray
      tertiary: "hsl(240, 5%, 60%)",        // Light gray
      disabled: "hsl(240, 5%, 70%)",        // Lighter gray
      onPrimary: "hsl(0, 0%, 100%)",        // White
    },
  },
  dark: {
    // Brand Colors
    brand: {
      primary: "hsl(230, 80%, 60%)",      // Brighter blue for dark mode
      secondary: "hsl(200, 75%, 65%)",    // Lighter blue for dark mode
      tertiary: "hsl(250, 70%, 70%)",     // Lighter purple for dark mode
      accent: "hsl(320, 75%, 70%)",       // Lighter magenta for dark mode
    },
    // UI Colors
    ui: {
      background: "hsl(240, 10%, 10%)",    // Dark gray
      foreground: "hsl(0, 0%, 95%)",       // Near white
      card: "hsl(240, 10%, 15%)",          // Slightly lighter dark gray
      border: "hsl(240, 5%, 20%)",         // Medium gray
      hover: "hsl(240, 5%, 25%)",          // Lighter medium gray
    },
    // Status Colors
    status: {
      success: "hsl(145, 70%, 55%)",       // Brighter green for dark mode
      warning: "hsl(40, 90%, 65%)",        // Brighter yellow for dark mode
      error: "hsl(0, 80%, 70%)",           // Brighter red for dark mode
      info: "hsl(210, 80%, 70%)",          // Brighter blue for dark mode
    },
    // Text Colors
    text: {
      primary: "hsl(0, 0%, 95%)",          // Near white
      secondary: "hsl(240, 5%, 80%)",      // Light gray
      tertiary: "hsl(240, 5%, 60%)",       // Medium gray
      disabled: "hsl(240, 5%, 40%)",       // Dark gray
      onPrimary: "hsl(0, 0%, 100%)",       // White
    },
  },
};

// Application status
export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
}

// Job data
export const JOB_STATUSES = [
  'NEW',
  'APPLIED',
  'INTERVIEW',
  'REJECTED'
] as const

export const SWISS_CANTONS = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR',
  'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG',
  'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'
] as const

export const WORKLOAD_OPTIONS = [
  '100%',
  '80-100%',
  '80%',
  '60-80%',
  '60%',
  '40-60%',
  '40%',
  '20-40%',
  '20%'
] as const

export const CONTRACT_TYPES = [
  'PERMANENT',
  'TEMPORARY',
  'INTERNSHIP',
  'APPRENTICESHIP'
] as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const

export const API_ENDPOINTS = {
  JOBS: '/api/jobs',
  COVER_LETTERS: '/api/cover-letters',
  SCRAPER: '/api/scraper'
} as const 

// Routes
export const ROUTES = {
  HOME: '/',
  JOBS: '/jobs',
  LOGIN: '/auth/signin',
  SIGNUP: '/auth/signup',
  PROFILE: '/profile',
  BETA_SIGNUP: '/auth/beta-signup',
}

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'zapjob-theme',
  USER_PREFERENCES: 'zapjob-preferences',
  RECENT_SEARCHES: 'zapjob-recent-searches',
}

// Analytics events
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  JOB_VIEW: 'job_view',
  JOB_APPLY: 'job_apply',
  JOB_SAVE: 'job_save',
  SEARCH: 'search',
  BETA_REQUEST: 'beta_request',
  GENERATE_COVER_LETTER: 'generate_cover_letter',
}