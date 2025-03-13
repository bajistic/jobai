# Personalized Jobs API

This API provides personalized job recommendations using the optimized local filtering based on pre-computed scores and tags.

## Endpoints

### `GET /api/jobs/personalized`

Returns personalized job recommendations for the current user, using local personalization of pre-computed job scores.

**Query Parameters:**
- `page`: Page number (default: 1)
- `pageSize`: Number of jobs per page (default: 20)
- `force`: Set to 'true' to use optimized filtering even if disabled globally

**Response:**
```json
{
  "jobs": [
    {
      "id": 12345,
      "title": "Software Developer",
      "company": "Tech Company",
      "location": "Zurich",
      "scores": { 
        "entryLevel": 3,
        "techRole": 5,
        "requiresDegree": -2,
        ...
      },
      "tags": ["remote", "entry-level", "tech"],
      "personalizedScore": 4.2,
      "job_preferences": [
        {
          "user_id": "user-123",
          "ranking": "good",
          "is_starred": false
        }
      ]
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

## How It Works

1. Jobs are pre-analyzed once daily using a comprehensive OpenAI prompt that evaluates them against a wide range of criteria.

2. The results (scores and tags) are stored in the database.

3. When a user requests personalized jobs, the system:
   - Retrieves the user's job ranker prompt from their profile
   - Parses the prompt to identify personal preferences and weights
   - Applies these weights to the pre-computed scores to calculate a personalized score for each job
   - Sorts and returns the jobs based on these personalized scores

4. No OpenAI API calls are made during this personalization process, making it extremely cost-effective.

## Benefits

- **Cost Reduction**: Significantly fewer OpenAI API calls (analyze once, personalize locally for all users)
- **Speed**: Faster response times since no API calls are needed for personalization
- **Consistency**: All jobs are evaluated with the same comprehensive criteria
- **Flexibility**: The scoring and ranking algorithm can be fine-tuned without making additional API calls

## Feature Flag

This feature is controlled by the `USE_OPTIMIZED_JOB_FILTERING` environment variable. When disabled, use the regular endpoints instead.