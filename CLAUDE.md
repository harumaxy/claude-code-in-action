# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe React components in natural language, and the AI generates them using a virtual file system. Components are displayed in real-time preview using an iframe sandbox.

## Common Commands

### Setup and Development

```bash
# Initial setup (install dependencies, generate Prisma client, run migrations)
npm run setup

# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Database Commands

```bash
# Generate Prisma client (after schema changes)
npx prisma generate

# Create and apply migrations
npx prisma migrate dev

# Reset database (destructive)
npm run db:reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Architecture

### Core Data Flow

1. **User Input** → ChatInterface component captures user request
2. **AI Processing** → POST to `/api/chat` route with messages and virtual file system state
3. **Tool Calls** → Claude uses `str_replace_editor` and `file_manager` tools to manipulate virtual files
4. **VirtualFileSystem** → In-memory file structure (never writes to disk)
5. **Live Preview** → PreviewFrame transforms JSX/TSX to ES modules using Babel, creates import maps with blob URLs, renders in sandboxed iframe

### Virtual File System

The `VirtualFileSystem` class (src/lib/file-system.ts) is the core abstraction. It maintains an in-memory tree structure of files and directories:

- Files are stored as `FileNode` objects in a Map
- All paths are normalized (start with `/`, no trailing slash except root)
- Supports operations: create, read, update, delete, rename
- Serializes to/from JSON for persistence in Prisma database
- Never writes to actual disk

### AI Tools Architecture

Two tools are provided to Claude via the Vercel AI SDK:

**str_replace_editor** (src/lib/tools/str-replace.ts):
- Commands: `view`, `create`, `str_replace`, `insert`
- Operates on the VirtualFileSystem instance
- Similar to typical text editor commands

**file_manager** (src/lib/tools/file-manager.ts):
- Commands: `rename`, `delete`
- Used for file/directory manipulation

### Preview System (Client-Side)

The preview system transforms and executes user-generated React code in an iframe sandbox:

1. **Transform** (src/lib/transform/jsx-transformer.ts):
   - Uses Babel Standalone to transform JSX/TSX to ES modules
   - Handles React automatic JSX runtime
   - Detects and strips CSS imports
   - Creates blob URLs for transformed modules

2. **Import Map Generation** (createImportMap function):
   - Maps React imports to esm.sh CDN
   - Creates blob URLs for all local files
   - Supports `@/` path alias (maps to root)
   - Handles missing imports with placeholder modules
   - Resolves third-party packages via esm.sh

3. **Preview HTML** (createPreviewHTML function):
   - Includes Tailwind CSS via CDN
   - Injects import map as `<script type="importmap">`
   - Creates ErrorBoundary for runtime errors
   - Displays syntax errors with formatted error UI
   - Loads entry point (App.jsx/App.tsx) via dynamic import

4. **Sandbox Security**:
   - iframe with `allow-scripts allow-same-origin allow-forms` sandbox
   - Uses srcdoc instead of src for content injection

### Authentication

JWT-based authentication using the `jose` library (src/lib/auth.ts):

- Sessions stored in httpOnly cookies
- 7-day expiration
- Passwords hashed with bcrypt
- Anonymous users can work without authentication (projects not saved)
- Middleware (src/middleware.ts) protects routes

### Database Schema

SQLite with Prisma:

- **User**: id, email, password (hashed), timestamps
- **Project**: id, name, userId (nullable for anon), messages (JSON), data (JSON), timestamps
- Project `messages` field stores conversation history
- Project `data` field stores serialized VirtualFileSystem state
- Generated Prisma client outputs to: `src/generated/prisma`

### AI Provider System

The app supports both real AI (Claude) and a mock provider (src/lib/provider.ts):

- If `ANTHROPIC_API_KEY` is set: Uses Claude Haiku 4.5 via Anthropic SDK
- If no API key: Uses `MockLanguageModel` class that returns canned responses
- Mock provider demonstrates tool usage patterns with static component templates
- Real provider uses prompt caching (ephemeral cache control on system message)

### Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── api/chat/            # AI chat endpoint (POST handler)
│   ├── [projectId]/         # Dynamic project route
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── chat/                # Chat UI (MessageList, MessageInput, ChatInterface)
│   ├── editor/              # Code editor (Monaco, file tree)
│   ├── preview/             # PreviewFrame component
│   ├── auth/                # Auth forms
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── file-system.ts       # VirtualFileSystem class
│   ├── tools/               # AI tool implementations
│   ├── transform/           # JSX transformation (Babel)
│   ├── contexts/            # React contexts (FileSystem, Chat)
│   ├── prompts/             # AI system prompts
│   ├── auth.ts              # JWT session management
│   ├── provider.ts          # AI provider (real/mock)
│   └── prisma.ts            # Prisma client singleton
└── actions/                 # Server Actions
```

## Testing

Tests use Vitest with jsdom environment. Test files are located in `__tests__` directories alongside source files:

```bash
# Run specific test file
npm test -- src/lib/__tests__/file-system.test.ts

# Run tests matching pattern
npm test -- file-system

# Run with UI
npm test -- --ui
```

## Important Patterns

### Path Alias (@/)

The `@/` alias maps to the `src/` directory in TypeScript imports:
- TypeScript: configured in tsconfig.json paths
- Preview system: manually resolved in jsx-transformer.ts

### Mock vs Real AI Provider

When working without an API key, the mock provider generates components based on keywords in the user prompt (form, card, counter). Check `src/lib/provider.ts` to understand the mock behavior.

### Message Streaming

The chat endpoint uses `streamText` from Vercel AI SDK with `maxSteps` for agentic behavior. The AI makes multiple tool calls in sequence until task completion.

### Project Persistence

Projects are auto-saved in the `onFinish` callback of `streamText` for authenticated users. The callback:
1. Checks for valid session
2. Combines original messages with response messages
3. Serializes VirtualFileSystem state
4. Updates project in database

## Custom Commands

This project includes custom Claude Code commands to streamline common tasks. Use these by typing `/` in Claude Code to see available commands:

### Available Commands

**`/audit`** - Update vulnerable dependencies
- Runs security audit on npm packages
- Applies updates with appropriate error handling
- Verifies tests pass after updates

**`/write_tests`** - Generate comprehensive tests
- Creates tests using Vitest and React Testing Library
- Follows project conventions (files in `__tests__/` directories)
- Covers happy paths, edge cases, and error states

## Environment Variables

Required (optional for development):
- `ANTHROPIC_API_KEY`: Anthropic API key (app works without it using mock provider)

Optional:
- `JWT_SECRET`: JWT signing secret (defaults to development key)
- `NODE_ENV`: Set to "production" for secure cookies
