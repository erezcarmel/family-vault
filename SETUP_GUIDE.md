# Family Vault Setup Guide

## Quick Start

### 1. Configure Environment Variables

Create a `.env.local` file in the project root (copy from `env.template`):

```bash
cp env.template .env.local
```

Edit `.env.local` and replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
OPENAI_API_KEY=your-openai-api-key
```

**Where to find these:**
- **Supabase:** Go to your project → Settings → API
  - Copy "Project URL" and "anon/public" key
- **OpenAI:** Go to https://platform.openai.com/api-keys
  - Create a new API key

### 2. Set Up Database

Run all migrations in your Supabase SQL Editor (in order):

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run each migration file:
   - `001_initial_schema.sql` - Core tables and RLS policies
   - `002_add_providers.sql` - Pre-configured provider list
   - `003_add_account_types.sql` - Pre-configured account types
   - `004_add_family_name.sql` - Family name feature
   - `005_add_family_connections.sql` - Family relationships
   - `006_add_member_images.sql` - Photo storage setup

**Tip:** Copy/paste each file's contents into the SQL Editor and click "Run"

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application!

## Application Flow

### 1. Sign Up / Sign In
- Users start at the sign-in page
- New users can create an account via the sign-up page
- Powered by Supabase Authentication

### 2. Onboarding
After signing up, users go through a 2-step onboarding:

**Step 1: Create Family**
- Enter your name to create your family

**Step 2: Family Tree (Optional)**
- Add family members with their details
- Can be skipped and completed later

### 3. Dashboard
Main hub showing all asset categories:
- 💰 Money Accounts (Active)
- 🛡️ Insurance (Active)
- 📊 Liabilities (Coming Soon)
- 🏥 Healthcare (Coming Soon)
- 💻 Digital Assets (Coming Soon)

### 4. Asset Management

**Money Accounts** includes:
- Checking/Saving Accounts
- Brokerage Accounts
- Retirement Accounts

**Insurance** includes:
- Life Insurance
- Home Insurance
- Health Insurance

Each asset can have:
- Provider name
- Account/policy type
- Account number
- Custom fields (user-defined)

## Features

✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Secure Authentication** - Supabase Auth with protected routes
✅ **Row-Level Security** - Users only see their own data
✅ **Custom Fields** - Add any additional information to assets
✅ **Modern UI** - Clean, bright design with Font Awesome icons
✅ **Family Tree** - Track and manage family members

## Development Tips

### Adding New Asset Categories

1. Update `types/index.ts` to add new category types
2. Create a new page in `app/dashboard/your-category/page.tsx`
3. Add navigation item in `components/Sidebar.tsx`
4. Add section card in `app/dashboard/page.tsx`

### Customizing Styles

Global styles are in `app/globals.css`. The project uses:
- Tailwind CSS for utility classes
- CSS custom properties for theme colors
- Component classes (btn-primary, card, input-field)

### Database Changes

Create new migration files in `supabase/migrations/` and run them in Supabase SQL Editor.

## Troubleshooting

**Issue**: "Invalid API key" error
- **Solution**: Check that your `.env.local` has the correct Supabase URL and anon key

**Issue**: "Table does not exist" error
- **Solution**: Make sure you've run the migration SQL in your Supabase project

**Issue**: Authentication not working
- **Solution**: Verify Supabase Auth is enabled in your project settings

**Issue**: Users can see other users' data
- **Solution**: Ensure Row Level Security policies are properly set up (check migration file)

## Security Notes

- Never commit `.env.local` to version control
- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Authentication is required for all dashboard routes

## Deploying to Vercel

### Quick Deployment Steps

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
6. Click "Deploy"

### After Deployment

**Important:** Configure Supabase redirect URLs:
1. Go to Supabase → Authentication → URL Configuration
2. Add your Vercel URL: `https://your-app.vercel.app/**`
3. Save changes

**See these guides for detailed instructions:**
- [VERCEL_SETUP.md](VERCEL_SETUP.md) - Quick fix if you see default Next.js page
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide with troubleshooting

## Next Steps

1. ✅ Set up your Supabase credentials
2. ✅ Run all database migrations
3. ✅ Start the dev server
4. ✅ Create your first account
5. 🚀 Start managing your family assets!
6. 🌐 Deploy to Vercel (optional)

For more information, see the main README.md file.

