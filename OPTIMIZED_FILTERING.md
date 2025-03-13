# Optimized Job Filtering System

This document describes the optimized job filtering system implemented to reduce OpenAI API costs while maintaining high accuracy in job recommendations.

## Overview

The original approach filtered 1,300 jobs for each user using their individual `jobRankerPrompt`, which incurred high API costs. The new approach filters all jobs once per day with a standardized, detailed prompt, stores the results, and personalizes them locally for each user using their preferences—all without deleting or overwriting existing functions.

## Key Features

1. **Daily Comprehensive Job Filtering**
   - New function `filterJobsOnceDaily()` runs once daily
   - Uses a single detailed OpenAI prompt to evaluate all jobs against common criteria
   - Returns structured JSON with scores and tags for each job
   - Stores results in the database for later personalization

2. **Local Personalization**
   - `getPersonalizedJobs()` retrieves pre-filtered jobs
   - Parses user's `jobRankerPrompt` to identify preferences
   - Calculates personalized scores locally
   - Returns jobs sorted by personalized relevance

3. **Hybrid Approach**
   - `rankJobHybrid()` provides a wrapper around both old and new methods
   - Preserves existing functionality while enabling the optimized approach
   - Falls back to the original method when needed

4. **Testing and Comparison**
   - Test endpoint to compare the old and new approaches
   - Validates accuracy with match percentage metrics
   - Provides performance comparisons

## Database Changes

The following fields were added to the `jobs` table:

- `scores`: JSON object with numeric values for various criteria
- `tags`: String array with descriptive labels
- `last_analyzed`: Timestamp of when the job was last analyzed

## API Endpoints

1. **Daily Filtering**
   - `POST /api/jobs/filter-daily`: Triggers daily job filtering (for cron/scheduler)
   - `GET /api/jobs/filter-daily`: Gets status of job filtering

2. **Personalized Jobs**
   - `GET /api/jobs/personalized`: Gets personalized job recommendations using local filtering

3. **Testing**
   - `GET /api/jobs/test-optimization`: Compares old and new filtering approaches

## Configuration

The system is controlled by the `USE_OPTIMIZED_JOB_FILTERING` environment variable:

```
USE_OPTIMIZED_JOB_FILTERING=true
```

When disabled, the system falls back to the original per-user filtering approach.

## Benefits

- **Cost Reduction**: Significantly fewer OpenAI API calls (only 1,300 per day)
- **Scalability**: Cost doesn't increase with user count
- **Consistency**: All jobs evaluated with the same comprehensive criteria
- **Performance**: Faster responses for users by eliminating API calls when viewing jobs

## Implementation

The implementation adds new functionality while preserving all existing code, allowing for a smooth transition between the old and new approaches and the ability to compare results.