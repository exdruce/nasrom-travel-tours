# NTT Booking System

Production-ready booking SaaS for NASROM Travel & Tours.

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS + Shadcn/UI
- **Payments:** Stripe (+ CHIP, BCL.my later)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── (auth)/       # Auth routes
│   ├── (dashboard)/  # Business dashboard
│   ├── (public)/     # Public booking pages
│   └── api/          # API routes
├── components/       # React components
├── lib/              # Utilities & clients
└── types/            # TypeScript types
```
