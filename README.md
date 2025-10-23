
  ## Supabase Integration
  
  1. Create a Supabase project in the dashboard.
  2. Copy your project URL and anon key.
  3. Create an `.env` file and set:
  
  ```env
  VITE_SUPABASE_URL=your_url
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```
  
  4. Create tables by running the SQL files in the `sql/` folder (in order):
  
  - `001_staff.sql`
  - `002_staff_permissions.sql`
  - `003_banks.sql`
  - `004_deposits.sql`
  - `005_client_incentives.sql`
  - `006_expenses.sql`
  - `007_bank_transactions.sql`
  - `008_withdrawals.sql`
  - `010_rls.sql`
  - `011_policies.sql`
  
  5. Install the client library:
  
  ```bash
  npm install @supabase/supabase-js
  ```
  
  6. The client is available at `src/lib/supabase.ts`.

## Deployment

### Vercel Deployment
This project is configured for easy deployment on Vercel:

1. **Build Command**: `npm run build`
2. **Output Directory**: `build`
3. **Node.js Version**: 20 (specified in `.nvmrc`)

### Local Build
For local testing, use the provided build script:
```bash
.\build.bat
```

### Environment Variables for Production
Set these in your Vercel dashboard (Settings → Environment Variables):

1. **VITE_SUPABASE_URL**: Your Supabase project URL
2. **VITE_SUPABASE_ANON_KEY**: Your Supabase anonymous key

**Note**: Copy values from `env.example` file and replace with your actual Supabase credentials.

## 🚀 Deployment Status

### ✅ Ready for Production
- **Build**: ✅ Working (`npm run build`)
- **Vercel Config**: ✅ Configured (`vercel.json`)
- **Node.js**: ✅ v20 specified (`.nvmrc`)
- **Environment**: ✅ Template ready (`env.example`)

### 🔗 Live Deployment
- **Vercel Project**: https://vercel.com/saurabhbhatiaodesks-projects/fliptrade-admin-suraj
- **GitHub Repository**: https://github.com/SaurabhBhatiaodesk/Fliptrade-Admin-suraj.git

### 📋 Deployment Checklist
- [x] Build configuration fixed
- [x] Vercel configuration updated
- [x] Environment variables template created
- [x] Node.js version specified
- [ ] Environment variables set in Vercel dashboard
- [ ] Production deployment completed
  