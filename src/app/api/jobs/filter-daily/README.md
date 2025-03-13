# Job Filtering Optimization API

This API implements an optimized job filtering approach to reduce OpenAI API costs while maintaining high accuracy in job recommendations.

## Endpoints

### `GET /api/jobs/filter-daily`

Returns status information about the optimized job filtering system.

**Response:**
```json
{
  "enabled": true,
  "analyzedJobsCount": 500,
  "lastAnalyzedAt": "2025-03-10T16:20:00.000Z"
}
```

### `POST /api/jobs/filter-daily`

Triggers the daily batch job filtering process. This should be called by a cron job or scheduler once per day.

**Query Parameters:**
- `limit`: Number of jobs to process (default: 100)
- `force`: Set to 'true' to ignore feature flag (requires admin)

**Response:**
```json
{
  "success": true,
  "processedCount": 50,
  "message": "Successfully processed 50 jobs"
}
```

## Implementation Details

The optimization works as follows:

1. Instead of filtering jobs for each user with their individual preferences (which requires many OpenAI API calls), the system analyzes all jobs once with a comprehensive set of criteria.

2. Each job is scored on various dimensions (entry-level, degree requirements, skill match, etc.) and tagged with relevant labels.

3. These pre-computed scores and tags are stored in the database.

4. When a user views jobs, their preferences are extracted from their `jobRankerPrompt` and used to locally calculate personalized scores for each job based on the pre-computed data.

This approach significantly reduces API costs while providing the same or better personalization.

## Configuration

The optimization is controlled by the `USE_OPTIMIZED_JOB_FILTERING` environment variable:

```
USE_OPTIMIZED_JOB_FILTERING=true
```

When disabled, the system will fall back to the original per-user filtering approach.

## Database Schema

The optimization adds three new fields to the `jobs` table:

- `scores`: A JSON object with numeric values for various criteria
- `tags`: An array of descriptive labels
- `last_analyzed`: When the job was last analyzed