# Beta Requests Admin API

This API provides endpoints for administrators to view and manage beta access requests.

## Endpoints

### GET `/api/admin/beta-requests`

Retrieves all beta access requests from the database.

#### Authentication

- Requires an authenticated user session
- In production, should add role verification for admin access

#### Response Format

**Success (200 OK):**

```json
[
  {
    "id": "clq1a2b3c4d5e6f7g8h9i0",
    "name": "John Doe",
    "email": "john@example.com",
    "requestDate": "2025-03-10T12:00:00.000Z",
    "status": "pending",
    "createdAt": "2025-03-10T12:00:00.000Z",
    "updatedAt": "2025-03-10T12:00:00.000Z"
  },
  // ... more requests
]
```

**Error (401 Unauthorized):**

```json
{
  "error": "Unauthorized"
}
```

**Error (500 Internal Server Error):**

```json
{
  "error": "Failed to fetch beta requests"
}
```

### PUT `/api/admin/beta-requests`

Updates the status of a beta access request.

#### Authentication

- Requires an authenticated user session
- In production, should add role verification for admin access

#### Request Format

```json
{
  "id": "clq1a2b3c4d5e6f7g8h9i0",
  "status": "approved" // or "rejected" or "pending"
}
```

#### Response Format

**Success (200 OK):**

```json
{
  "id": "clq1a2b3c4d5e6f7g8h9i0",
  "name": "John Doe",
  "email": "john@example.com",
  "requestDate": "2025-03-10T12:00:00.000Z",
  "status": "approved", // Updated status
  "createdAt": "2025-03-10T12:00:00.000Z",
  "updatedAt": "2025-03-10T12:00:00.000Z"
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Invalid request data"
}
```

**Error (401 Unauthorized):**

```json
{
  "error": "Unauthorized"
}
```

**Error (500 Internal Server Error):**

```json
{
  "error": "Failed to update beta request"
}
```

## Implementation Details

### GET Endpoint

The GET endpoint:
1. Verifies the user is authenticated
2. Fetches all beta requests from the database using Prisma
3. Orders the requests by request date (newest first)
4. Returns the requests as a JSON array

### PUT Endpoint

The PUT endpoint:
1. Verifies the user is authenticated
2. Extracts the request ID and new status from the request body
3. Validates the data (required fields, valid status values)
4. Updates the request in the database using Prisma
5. Returns the updated request object

## Database Interaction

Uses Prisma to interact with the `BetaRequest` table:
- `prisma.betaRequest.findMany()` - To get all requests
- `prisma.betaRequest.update()` - To update a request's status

## Future Enhancements

Potential improvements:
- Add pagination for large numbers of requests
- Add filtering options (by status, date range, etc.)
- Add search functionality
- Add sorting options
- Add batch operations (approve/reject multiple)
- Add email notification integration
- Add audit logging for admin actions