# Deploying Family Vault to Vercel

This guide will walk you through deploying your Family Vault application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier works)
2. Your Supabase project set up and running
3. An OpenAI API key (for document scanning features)
4. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Supabase Database

Make sure all migrations have been applied to your Supabase database:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Run each migration file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_add_providers.sql`
   - `supabase/migrations/003_add_account_types.sql`
   - `supabase/migrations/004_add_family_name.sql`
   - `supabase/migrations/005_add_family_connections.sql`
   - `supabase/migrations/006_add_member_images.sql`

5. Verify the storage bucket was created:
   - Go to **Storage** in Supabase
   - You should see a `family-member-photos` bucket
   - If not, run migration 006 again

## Step 2: Get Your Supabase Credentials

From your Supabase project dashboard:

1. Click on **Settings** (gear icon in sidebar)
2. Go to **API** section
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 3: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to **API Keys**
4. Click **Create new secret key**
5. Copy the key (you won't be able to see it again!)

## Step 4: Push Your Code to Git

If you haven't already, push your code to a Git repository:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Family Vault"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/family-vault.git

# Push to main branch
git push -u origin main
```

## Step 5: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your Git repository
4. Configure your project:
   - **Framework Preset:** Next.js (should be auto-detected)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

5. **Add Environment Variables** (CRITICAL STEP):
   Click **Environment Variables** and add these:
   
   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `OPENAI_API_KEY` | Your OpenAI API key |

6. Click **Deploy**
7. Wait for the build to complete (2-3 minutes)
8. Click on the deployment URL to view your app!

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (will prompt for settings)
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: family-vault
# - Directory: ./
# - Override settings? No

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase anon key when prompted

vercel env add OPENAI_API_KEY
# Paste your OpenAI API key when prompted

# Deploy to production
vercel --prod
```

## Step 6: Configure Supabase Authentication

After deploying, you need to add your Vercel URL to Supabase's allowed redirect URLs:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel URLs to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   https://your-app.vercel.app/auth/callback
   ```
4. Also add to **Site URL**:
   ```
   https://your-app.vercel.app
   ```
5. Click **Save**

## Step 7: Test Your Deployment

1. Visit your Vercel deployment URL
2. You should be redirected to the sign-in page
3. Test the sign-up flow:
   - Create a new account
   - Complete onboarding
   - Add family members
   - Create assets
4. Test document scanning (upload a document image)
5. Test all navigation and features

## Troubleshooting

### Issue: Getting "To get started, edit page.tsx"

**Solution:** This means environment variables are not set.

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Verify all three variables are present
3. If missing, add them
4. Go to **Deployments** tab
5. Click the **...** menu on the latest deployment
6. Click **Redeploy**

### Issue: Build fails with TypeScript errors

**Solution:** 
```bash
# Run build locally to check
npm run build

# Fix any TypeScript errors
# Then commit and push
git add .
git commit -m "Fix TypeScript errors"
git push
```

### Issue: Authentication not working

**Solution:**
1. Check that redirect URLs are configured in Supabase
2. Verify environment variables in Vercel
3. Check browser console for errors
4. Make sure you're using the production Supabase project (not a local one)

### Issue: Database queries failing

**Solution:**
1. Verify all migrations (001-018) have been run in Supabase SQL Editor in order
2. Check Row Level Security (RLS) policies are active
3. Test database connection from Supabase Dashboard

**Common error**: "Could not find the table 'public.executors' in the schema cache"
- This means migration `012_add_executors.sql` (or other migrations) haven't been run
- Run all missing migrations in sequence from the `supabase/migrations/` folder

### Issue: Image uploads not working

**Solution:**
1. Go to Supabase → **Storage**
2. Verify `family-member-photos` bucket exists
3. Check bucket is set to **Public**
4. Verify storage policies in migration 006

### Issue: Document scanning not working

**Solution:**
1. Verify `OPENAI_API_KEY` is set in Vercel
2. Check OpenAI account has credits
3. Check browser console for API errors
4. Verify API route is deployed: `https://your-app.vercel.app/api/scan-document`

## Updating Your Deployment

To deploy updates:

```bash
# Make your changes
# Commit and push to Git
git add .
git commit -m "Your update message"
git push

# Vercel will automatically deploy your changes
```

Or manually trigger a redeployment in the Vercel Dashboard.

## Custom Domain (Optional)

To add a custom domain:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **Add**
3. Enter your domain (e.g., `familyvault.com`)
4. Follow DNS configuration instructions
5. Add the custom domain to Supabase redirect URLs

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key (public) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for document scanning |

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put sensitive keys with this prefix!

## Security Checklist

- [ ] All environment variables are set in Vercel
- [ ] Supabase redirect URLs are configured
- [ ] RLS policies are enabled on all tables
- [ ] Storage bucket policies are configured
- [ ] `.env.local` file is in `.gitignore` (never commit API keys!)
- [ ] OpenAI API key has spending limits set
- [ ] Supabase project has good password requirements

## Performance Optimization

Vercel automatically provides:
- ✅ Edge caching
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Image optimization
- ✅ Serverless functions

## Monitoring

Monitor your deployment:
- **Vercel Analytics:** Vercel Dashboard → Analytics
- **Supabase Logs:** Supabase Dashboard → Logs
- **OpenAI Usage:** OpenAI Platform → Usage

## Support

If you need help:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Congratulations! Your Family Vault is now live! 🎉**

