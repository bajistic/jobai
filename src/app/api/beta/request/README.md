# Beta Request API Endpoint

This API endpoint handles the submission and storage of beta access requests.

## Endpoint Details

- **Route**: `/api/beta/request`
- **Method**: POST
- **Purpose**: Processes and stores beta access requests from the signup form

## Request Format

### Required Fields:

```json
{
  "name": "User's full name",
  "email": "user@example.com"
}
```

### Validation:

- `name`: Required, string
- `email`: Required, string in valid email format

## Response Format

### Success (200 OK):

```json
{
  "success": true,
  "message": "Beta request received"
}
```

### Error (400 Bad Request):

```json
{
  "error": "Name and email are required"
}
```

### Error (500 Internal Server Error):

```json
{
  "error": "Failed to process beta request"
}
```

## Implementation Details

The endpoint:

1. Extracts `name` and `email` from the request body
2. Validates that required fields are present
3. Checks if a request with the same email already exists
4. If a duplicate exists, updates the existing record
5. If it's a new email, creates a new record
6. Returns a success or error response

## Database Interaction

Uses Prisma to interact with the `BetaRequest` table:

- `prisma.betaRequest.findFirst()` - To check for duplicates
- `prisma.betaRequest.update()` - To update existing requests
- `prisma.betaRequest.create()` - To create new requests

## Error Handling

- Input validation errors return 400 status code
- Database or server errors return 500 status code
- All errors are logged to the console

## Usage

Call this endpoint from client-side code when a user submits the beta request form:

```javascript
// Example client-side code
const submitBetaRequest = async (name, email) => {
  try {
    const response = await fetch('/api/beta/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });
    
    if (response.ok) {
      // Handle success
    } else {
      // Handle error
    }
  } catch (error) {
    // Handle network error
  }
};
```

## Security Considerations

- This endpoint is publicly accessible (no authentication required)
- Input validation helps prevent malicious data
- Consider adding rate limiting for production use
- Consider adding CAPTCHA for spam prevention