# Beta Signup Component

This component handles the beta access request process for new users.

## Overview

The beta signup form collects basic information from users interested in trying the ZapJob platform during its beta phase. It provides a simple, user-friendly interface for submitting requests, which are then stored in the database for review by administrators.

## Implementation Details

### Component Structure

- `BetaSignUpContent`: The main form component that handles state and submission
- `BetaSignUpPage`: Wrapper component with Suspense for loading state

### State Management

The component uses React's useState hook to manage:
- Form fields (name, email)
- Terms agreement checkbox
- Form submission state
- Error handling

### Form Submission

When submitted, the form:
1. Validates all required fields are present
2. Checks that user has agreed to terms
3. Submits data to `/api/beta/request` endpoint
4. Shows appropriate loading state and error messages
5. Redirects to a success page on completion

### API Integration

The form interacts with:
- `/api/beta/request` to submit new beta access requests

### Database

Requests are stored in the `BetaRequest` table with fields:
- `id`: Unique identifier
- `name`: User's full name
- `email`: User's email address
- `requestDate`: When the request was made
- `status`: Current status (pending, approved, rejected)
- `createdAt`/`updatedAt`: Timestamps

## Usage

### Integration with Other Components

This component is linked from:
- The landing page "Request Beta Access" buttons
- The sign-in page for users without accounts

### Testing

When testing this component, check:
- Form validation (required fields, terms checkbox)
- Submission handling (success, errors)
- Redirection to success page
- Database entries creation

### Customization

To modify the form:
1. Edit the fields in the form JSX
2. Update the state variables accordingly
3. Modify the submission handler to include new fields
4. Update the API endpoint to handle the new data structure
5. Update the Prisma schema if adding new fields to store

## Future Improvements

Potential enhancements:
- Add additional fields for better qualification (e.g., job title, company)
- Add reCAPTCHA integration to prevent spam
- Implement email verification step
- Add analytics tracking for form submissions