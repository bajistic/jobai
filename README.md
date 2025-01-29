## Main Components 

1. JobContext: Manages job-related state and operations. It uses a split provider pattern, which I remember from earlier discussions. The provider handles fetching jobs, pagination, and status updates.
2. RankJobsPage: This is the page where users can rank unranked jobs. It uses the JobContext to get unranked jobs and the rankJob function. There are two versions: one for ranking all jobs and another for individual jobs.
3. JobPreview: Displays detailed job information. It's a client component that shows job details and allows navigation back to the list, especially on mobile.
4. OpenAIService and DeepSeekService: These services handle AI operations like generating cover letters and ranking jobs. The user is migrating from OpenAI to DeepSeek, so both are present, but DeepSeek is the new focus.
5. API Routes: Several API endpoints handle job ranking, cover letter generation, and fetching unranked jobs. These routes interact with the database and AI services.
6. ScraperService: Responsible for scraping job details from external sources and processing them into the application's Job format.
7. ProfilePage: Lets users configure AI settings, upload documents for context, and view their uploaded files.

### OpenAI / Deepseek Services


AI Services: Handle cover letter generation and job ranking
Migration State: Dual implementation with OpenAI (legacy) and DeepSeek (new)
Key Difference: DeepSeek uses direct API calls vs OpenAI's thread/assistant model

### State Management

* Central Hub: Manages jobs data, pagination, and ranking operations
* Key Features:
  * Split provider pattern for Next.js compatibility
  * Handles API communication for jobs
  * Maintains unranked jobs list
  
### Job Ranking Flow

* Two Implementations:
1. Single-job ranking with instant next-job fetch
2. Bulk ranking of all unranked jobs
* Common Logic:
  * Uses JobContext's rankJob method
  * Integrates with /api/jobs/rank endpoint
  
* Critical Paths:
  * Cover letter generation (streaming)
  * Job ranking analysis
  * Document context processing
  

### Data Flow

> ScraperService → DB → JobContext → Components
>           ↓
> AI Services → Ranking/Generation → DB

Key Observations
1. Dual AI Implementation: Current system uses both OpenAI and DeepSeek simultaneously
2. Context Pattern: JobContext provides centralized state management
3. Migration Needed: API routes still reference OpenAIService (e.g. rankall/route.ts)
4. Document Handling: Profile page uploads feed into AI context building
Suggested Next Steps
1. Create AI service abstraction layer
2. Update API routes to use DeepSeekService
3. Implement feature flagging for AI provider selection
4. Consolidate ranking page implementations
Would you like me to elaborate on any specific aspect?