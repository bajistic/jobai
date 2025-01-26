export interface JobFilter {
  searchQuery?: string;
  location?: string;
  canton?: string;
  ranking?: string;
  status?: JobStatus;
  showHidden?: boolean;
  onlyStarred?: boolean;
  onlyApplied?: boolean;
}

export interface JobFetchOptions {
  onlyStarred?: boolean
  showHidden?: boolean
  status?: string
  page?: number
  pageSize?: number
  location?: string
  ranking?: string
}

export enum JobStatus {
  NEW = 'new',
  APPLIED = 'applied',
  REJECTED = 'rejected',
  INTERVIEW = 'interview'
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  address?: string;
  canton?: string;
  description: string;
  url: string;
  workload?: string;
  published?: Date;
  ranking?: string;
  categories: string[];
  contract?: string;
  status: JobStatus;
  notes?: string;
  preferences?: JobPreference[];
  cover_letter?: CoverLetter[];
  isHidden?: boolean;
  isStarred?: boolean;
}

export interface JobPreference {
  id: number;
  job_id: number;
  user_id: number;
  is_hidden?: boolean;
  is_starred?: boolean;
  created_at: Date;
  updated_at: Date;
  notes?: string;
}

export interface CoverLetter {
  id: number;
  jobId: number;
  content: string;
  docs_url?: string;
  created_at: Date;
} 