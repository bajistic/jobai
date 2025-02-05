# TODO: Add a link to the documentation for the frontend
- [ ] fix filter by url params
- [ ] applied status
- [ ] 02.02.2025 add external jobs by url
- [ ] cover letter dialog
- [ ] scrape jobs > ansprechperson
- [ ] generate responses for questions like
- [ ] interview vorbereitung
- [ ] applied timestamp
- [ ] user rank jobs

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

- Central Hub: Manages jobs data, pagination, and ranking operations
- Key Features:
  - Split provider pattern for Next.js compatibility
  - Handles API communication for jobs
  - Maintains unranked jobs list

### Job Ranking Flow

- Two Implementations:

1. Single-job ranking with instant next-job fetch
2. Bulk ranking of all unranked jobs

- Common Logic:
  - Uses JobContext's rankJob method
  - Integrates with /api/jobs/rank endpoint
- Critical Paths:
  - Cover letter generation (streaming)
  - Job ranking analysis
  - Document context processing

### Data Flow

> ScraperService → DB → JobContext → Components
> ↓
> AI Services → Ranking/Generation → DB

Key Observations

1. Dual AI Implementation: Current system uses both OpenAI and DeepSeek simultaneously
2. Context Pattern: JobContext provides centralized state management
3. Migration Needed: API routes still reference OpenAIService (e.g. rankall/route.ts)
4. Document Handling: Profile page uploads feed into AI context building
   Suggested Next Steps
5. Create AI service abstraction layer
6. Update API routes to use DeepSeekService
7. Implement feature flagging for AI provider selection
8. Consolidate ranking page implementations
   Would you like me to elaborate on any specific aspect?

Here's the SQL query to migrate ratings from the jobs table to the job_preferences table:
;

-- Insert ratings from jobs table into job_preferences
-- This will create new job_preferences records for jobs that have ratings

```SQL
  INSERT INTO job_preferences (job_id, user_id, ranking)
  SELECT
      id as job_id,
      'DEFAULT_USER_ID' as user_id, -- Replace with actual user ID
      ranking as ranking
  FROM jobs
  WHERE rating IS NOT NULL
  ON CONFLICT (user_id, job_id) DO UPDATE
  SET ranking = EXCLUDED.ranking;
```

-- After confirming the migration worked, you can remove the rating column
-- ALTER TABLE jobs DROP COLUMN rating;
A few important notes:
Replace 'DEFAULT_USER_ID' with the actual user ID you want to associate these ratings with
The ON CONFLICT clause assumes you have a unique constraint on (user_id, job_id). If you don't, you might want to add it first
I've commented out the DROP COLUMN command - only run this after verifying the data migration was successful
Make sure to backup your database before running these queries
If you need to verify the migration, you can use this query:
SELECT j.id, j.rating as old_rating, jp.ranking as new_rating
FROM jobs j
LEFT JOIN job_preferences jp ON j.id = jp.job_id
WHERE j.rating IS NOT NULL;

# Application Documentation

## Overview

- Application name and purpose
- Key features
- Target users
- Technology stack
- System requirements

## Architecture

- High-level system design
- Component diagram
- Database schema
- External integrations/APIs

Code Documentation
Inline Code Comments: Document functions, classes, and complex logic

```javascript
def process_user_data(user_input: dict) -> dict:
       """
       Process and validate user input data.

       Args:
           user_input (dict): Raw user input containing name, email, etc.

       Returns:
           dict: Processed and validated user data

       Raises:
           ValidationError: If input data is invalid
       """
       # Implementation
```

# API Documentation

## Endpoints

### `POST /api/users`

Create a new user

**Request Body:**

```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "id": "string",
  "name": "string",
  "created_at": "timestamp"
}
```

4. **Process Documentation**

```markdown
# Development Processes

## Git Workflow

1. Branch naming convention
2. Commit message format
3. PR review process

## Deployment Process

1. Build steps
2. Environment configuration
3. Release procedures

## Testing Strategy

1. Unit testing approach
2. Integration testing
3. E2E testing
```

5. **Setup Documentation**

```markdown
# Setup Guide

## Development Environment

1. Required software
2. Environment variables
3. Installation steps
4. Running locally

## Production Environment

1. Server requirements
2. Configuration
3. Monitoring setup
```

6. **User Documentation**

```markdown
# User Guide

## Getting Started

1. Installation instructions
2. Initial configuration
3. Basic usage

## Features

- Detailed explanation of each feature
- Usage examples
- Common issues and solutions
```

7. **Maintenance Documentation**

```markdown
# Maintenance Guide

## Regular Tasks

- Database backups
- Log rotation
- Performance monitoring

## Troubleshooting

- Common issues
- Debug procedures
- Error codes and meanings
```

To implement this documentation:

1. **Tools You Can Use**:

   - JSDoc/TypeDoc for JavaScript/TypeScript
   - Swagger/OpenAPI for API documentation
   - Markdown files for general documentation
   - Draw.io or Mermaid for diagrams
   - Storybook for UI components

2. **Best Practices**:

   - Keep documentation close to code
   - Update docs with code changes
   - Use automated documentation tools where possible
   - Include examples and use cases
   - Add diagrams for complex processes
   - Version your documentation

3. **Organization**:
   i want to document my entire app in its functions, designs and processses

I'll help you create comprehensive documentation for your app. Here's a suggested structure for documenting your application:
Project Overview Documentation
requirements
Code Documentation
Inline Code Comments: Document functions, classes, and complex logic
def process_user_data(user_input: dict) -> dict:
"""
Process and validate user input data.

       Args:
           user_input (dict): Raw user input containing name, email, etc.

       Returns:
           dict: Processed and validated user data

       Raises:
           ValidationError: If input data is invalid
       """
       # Implementation

README.md files in each major directory:

API Documentation

/docs
/api

    endpoints.md
    models.md

/development

    setup.md
    workflow.md

/architecture

    system-design.md
    database.md

/user-guide

    getting-started.md
    features.md

/maintenance

    deployment.md
    troubleshooting.md


