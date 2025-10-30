# How to Get Your Correct Supabase API Key

## Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project (the one with URL: uwooqqjtwnorpiszpeah.supabase.co)

## Step 2: Get the API Key
1. In your project dashboard, go to **Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll see two keys:
   - **anon** key (public) - This is what we need
   - **service_role** key (secret) - Don't use this one

## Step 3: Copy the anon key
- Copy the **anon** key (it starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- It should be different from the current one in the code

## Step 4: Update the Code
Once you have the correct key, I'll update it in the code and enable database connection.

## Current Status:
- ✅ Application is working with localStorage data
- ❌ Database connection disabled due to invalid API key
- 🔄 Ready to enable database once correct key is provided

## Test Login:
- Email: admin@gmail.com
- Password: admin123

All your data will be saved in localStorage and persist between sessions.
