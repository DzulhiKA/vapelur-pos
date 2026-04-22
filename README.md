# Vapelur POS

Point of Sale system built with Next.js 15, Supabase, and Tailwind CSS.

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment variables
Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Project Structure
```
vapelur-pos/
├── app/                  # Next.js App Router pages
│   ├── admin/            # Admin panel (dashboard, products, users, etc.)
│   ├── pos/              # POS interface
│   └── login/            # Auth page
├── components/           # Reusable React components
│   ├── admin/
│   └── pos/
├── lib/                  # Utilities & Supabase clients
│   ├── supabase/
│   │   ├── client.ts     # Browser client
│   │   └── server.ts     # Server client
│   └── utils.ts          # Helper functions (cn, formatRupiah, etc.)
├── types/                # TypeScript type definitions
└── middleware.ts         # Auth middleware
```
