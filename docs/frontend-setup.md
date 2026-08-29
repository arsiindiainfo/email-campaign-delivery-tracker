# Frontend Setup

## Requirements

- Node.js 22+
- A running backend API (see [backend-setup.md](backend-setup.md)) or the
  Docker Compose stack

## Install & run

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL if not http://localhost:3000
npm run dev
```

Vite serves the SPA at http://localhost:5173.

## Build

```bash
npm run build   # outputs to dist/, served by nginx in the Docker image
npm run preview # sanity-check the production build locally
```

## Structure

```
src/
├── app/            router, providers, layout shell
├── features/       one folder per business area (campaigns, templates, contacts, ...)
├── components/     shared, presentational-only components
├── lib/            apiClient (axios + interceptors), queryClient, formatters
└── types/          API response types mirrored from the backend DTOs
```

Server state lives only in React Query's cache — see the plan's §21.2 for why
there's no separate Redux/Zustand store for data the API already owns.
