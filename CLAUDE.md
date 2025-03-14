# CLAUDE.md - Project Guidelines

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **API Integration**: OpenAI API, Google Docs API
- **Testing**: Playwright for component/E2E testing

## Commands
- `npm run dev`: Start development server (port 3003 with inspector)
- `npm run build`: Build for production
- `npm run lint`: Run ESLint checks
- `npx prisma migrate dev`: Run database migrations
- `npx prisma studio`: Open Prisma database UI
- `npx playwright test [file]`: Run specific test file

## Code Style
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Imports**: Group by source (React/Next → libraries → local), no absolute paths
- **TypeScript**: Strict mode, explicit types for functions and props
- **Components**: 'use client' directive, props interface, self-contained files
- **Error Handling**: try/catch with detailed error messages and HTTP status codes
- **UI**: Radix UI components with Tailwind, use cn() for conditional classes
- **State**: useState for component state, useContext (JobContext) for shared state
- **Formatting**: Follow Next.js/TypeScript conventions from ESLint config

## Project Structure
- `/src/app`: Next.js App Router with pages and API routes
- `/src/components`: UI components with `/ui/` for shadcn components
- `/src/contexts`: React contexts for state management
- `/src/lib`: Utilities, types, and configurations
- `/src/services`: External API integrations (OpenAI, Google, scraper)
- `/prisma`: Database schema and migrations

## API Patterns
- RESTful routes under `/src/app/api/`
- Resource-based organization (jobs, auth, scraper, profile)
- Nested routes for specific operations (e.g., `/jobs/[id]/star`)
- Consistent error handling with appropriate status codes
- Session-based auth checks

## Database Schema
- Key models: User, Jobs, job_preferences, cover_letters, UserDocument
- NextAuth integration with Account, Session models
- Migrations in prisma/migrations

## Command Blacklist
Do not execute any of these dangerous commands:
- `rm -rf /` - Deletes entire filesystem
- `dd if=/dev/random of=/dev/sda` - Overwrites disk with random data
- `chmod -R 777 /` - Sets unsafe permissions on all files
- `wget [malicious URL] -O- | bash` - Downloads and executes untrusted scripts
- `sudo rm -rf /*` - Attempts to delete all files
- `mv ~ /dev/null` - Deletes home directory
- `> ~/.bash_history` - Clears command history
- `curl [any URL] | bash` - Executes untrusted scripts from the web
- `find / -type f -exec rm -f {} \;` - Deletes all files
- `mkfs.*` - Formats filesystems
- `echo [malicious content] > /etc/passwd` - Modifies system files
- `kill -9 1` - Kills init process
- `killall5` - Kills all user processes
- `shutdown` - Shuts down the system
- `reboot` - Reboots the system
- Any command that would delete or modify system files