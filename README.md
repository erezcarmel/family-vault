# Family Vault - Family Assets Management System

A modern, secure web application for managing your family's assets, insurance policies, and important documents.

## Features

- 🔐 **Secure Authentication** - Powered by Supabase
- 👥 **Family Tree Management** - Track family members with photos and relationships
- 💰 **Money Accounts** - Manage checking, savings, brokerage, and retirement accounts
- 🛡️ **Insurance Tracking** - Life, home, and health insurance policies
- 📄 **AI Document Scanning** - Extract data from documents using OpenAI
- 📸 **Image Storage** - Upload family member photos to Supabase Storage
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎨 **Modern UI** - Beautiful, bright design with Tailwind CSS
- 🔒 **Privacy First** - Row-level security ensuring users only see their own data

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: OpenAI GPT-4o Vision
- **Icons**: Font Awesome
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd family-vault
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
```

4. Set up the database:

Go to your Supabase project's SQL Editor and run all migration files in order:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_add_providers.sql`
- `supabase/migrations/003_add_account_types.sql`
- `supabase/migrations/004_add_family_name.sql`
- `supabase/migrations/005_add_family_connections.sql`
- `supabase/migrations/006_add_member_images.sql`

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment to Vercel

### Quick Deploy

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel](https://vercel.com/new)
3. Import your repository
4. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
5. Click Deploy!

**Important:** After deploying, add your Vercel URL to Supabase's allowed redirect URLs:
- Go to Supabase Dashboard → Authentication → URL Configuration
- Add: `https://your-app.vercel.app/**`

**Full guide:** [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)

### Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key |
| `OPENAI_API_KEY` | Yes | OpenAI API key for document scanning |

**⚠️ Critical:** Environment variables must be added in Vercel dashboard before or after deployment.

See [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) for complete deployment instructions.

## Project Structure

```
family-vault/
├── app/                          # Next.js app directory
│   ├── auth/                     # Authentication pages
│   │   ├── signin/              # Sign in page
│   │   └── signup/              # Sign up page
│   ├── dashboard/               # Main dashboard
│   │   ├── money-accounts/      # Money accounts management
│   │   ├── insurance/           # Insurance policies management
│   │   └── family/              # Family tree management
│   ├── onboarding/              # Onboarding flow
│   │   └── family-tree/         # Family tree setup
│   └── page.tsx                 # Home page (redirects)
├── components/                   # Reusable components
│   ├── Sidebar.tsx              # Navigation sidebar
│   ├── AssetCard.tsx            # Asset display card
│   └── AssetModal.tsx           # Asset add/edit modal
├── lib/                         # Library code
│   └── supabase/                # Supabase client utilities
│       ├── client.ts            # Browser client
│       ├── server.ts            # Server client
│       └── middleware.ts        # Auth middleware
├── types/                       # TypeScript type definitions
│   └── index.ts
└── supabase/                    # Supabase configurations
    └── migrations/              # Database migrations
```

## Database Schema

### Tables

1. **families** - Family/household information
   - id, user_id, main_user, created_at, updated_at

2. **family_members** - Family tree data
   - id, family_id, name, email, relationship, created_at, updated_at

3. **assets** - Financial assets and insurance (with JSONB data field)
   - id, family_id, category, type, data (JSONB), created_at, updated_at

4. **asset_categories** - Track asset categories
   - id, family_id, title, count, created_at, updated_at

## Features Roadmap

### Current Features (v1.0)
- ✅ User authentication (sign up/sign in)
- ✅ User onboarding flow
- ✅ Family tree management
- ✅ Money accounts tracking
- ✅ Insurance policies tracking
- ✅ Custom fields for assets
- ✅ Responsive design

### Recently Added (v1.1)
- ✅ AI-powered document scanning (OpenAI GPT-4o)
- ✅ Family member photo uploads
- ✅ Family member relationship tracking
- ✅ Editable family name
- ✅ Pre-configured providers and account types

### Coming Soon
- 🔜 Liabilities management
- 🔜 Healthcare records
- 🔜 Digital assets tracking
- 🔜 Export/import data
- 🔜 Family sharing (share assets with family members)
- 🔜 Reminders and notifications

## Security

- Row-level security (RLS) enabled on all tables
- Users can only access their own data
- Secure authentication with Supabase Auth
- Protected API routes with middleware

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For support, please open an issue in the GitHub repository.
