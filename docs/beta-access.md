# Beta Access System Documentation

This document explains the beta access request system implemented in ZapJob.

## Overview

The beta access system allows users to request early access to the ZapJob platform. Administrators can review and approve or reject these requests through an admin interface. The system stores all beta requests in a database and provides tools for managing the beta program.

## User Flow

1. A visitor discovers ZapJob through the landing page
2. They click "Request Beta Access" on the landing page
3. They fill out a simple form with their name, email, and consent to terms
4. Their request is saved to the database with a "pending" status
5. An administrator reviews the request and can approve or reject it
6. If approved, the user can be notified (future implementation)

## Implementation Components

### Database

The system uses a `BetaRequest` table in the PostgreSQL database with the following schema:

```prisma
model BetaRequest {
  id          String   @id @default(cuid())
  name        String
  email       String
  requestDate DateTime @default(now())
  status      String   @default("pending") // pending, approved, rejected
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([email])
}
```

### API Endpoints

The system includes two main API endpoints:

1. **`/api/beta/request` (POST)**
   - Accepts beta access requests from the form
   - Validates the required fields (name, email)
   - Checks for duplicate requests (updates existing ones)
   - Stores the request in the database

2. **`/api/admin/beta-requests` (GET, PUT)**
   - **GET**: Retrieves all beta requests for the admin interface
   - **PUT**: Updates the status of a beta request (approve/reject)
   - Secured with authentication to ensure only authorized users can access

### Pages

1. **Beta Request Form** (`/auth/beta-signup`)
   - Simple form that collects name and email
   - Requires agreement to terms
   - Provides feedback on submission

2. **Success Page** (`/auth/beta-success`)
   - Confirms the request was received
   - Explains next steps to the user

3. **Admin Interface** (`/admin/beta-requests`)
   - Lists all beta requests with their status
   - Provides buttons to approve or reject requests
   - Shows relevant information for decision-making

## Security Considerations

- The beta request endpoint is publicly accessible but validates inputs
- The admin endpoints are protected by authentication
- In a production environment, additional authorization checks should be added to ensure only administrators can access the admin interface

## Future Enhancements

These features could be added in the future:

1. Email notifications to administrators when new requests are received
2. Automatic emails to users when their request is approved
3. Integration with user creation to streamline the onboarding process
4. Filtering and searching capabilities in the admin interface
5. Analytics on beta program adoption and engagement

## Usage Instructions

### For Administrators

1. Access the admin interface at `/admin/beta-requests`
2. Review pending requests by reading the submitted information
3. Click "Approve" to grant access or "Reject" to decline
4. The status updates in real-time and is saved to the database

### For Developers

When building on this system:

1. Use the `prisma.betaRequest` model for database operations
2. Hook into the approval process for additional functionality (e.g., creating user accounts)
3. Consider the security implications when extending the admin functionality