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
  published: Date;
  ranking?: string;
  isHidden?: boolean;
  isStarred?: boolean;
  categories: string[];
  contract?: string;
  status: JobStatus;
  notes?: string;
  coverLetter?: CoverLetter;
}

export interface CoverLetter {
  id: number;
  jobId: number;
  content: string;
  googleDocsUrl?: string;
  createdAt: Date;
} 