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