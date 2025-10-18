# Quick Start - Deploy in 5 Minutes

This guide will get your Hockey Development Tracker deployed as quickly as possible.

## Prerequisites

- GitHub account
- Supabase account (free tier works)
- Railway/Render account (free tier works)

## Step 1: Get Database Password (2 minutes)

1. Go to https://supabase.com/dashboard/project/kqdcikqnyatyyfpobrzt
2. Click **Settings** → **Database**
3. Scroll to **Connection string** → **URI**
4. Click **Copy** (the password is already in the string)
5. Save this connection string - you'll need it in Step 3

Example format:
```
postgresql://postgres.kqdcikqnyatyyfpobrzt:[YOUR-PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

## Step 2: Choose Deployment Platform (30 seconds)

### Option A: Railway (Recommended)

**Why Railway?**
- Easiest setup
- Auto-detects everything
- Great free tier
- Excellent for Node.js apps

**Go to**: https://railway.app

### Option B: Render

**Why Render?**
- Simple YAML-based config
- Good free tier
- Built-in database options

**Go to**: https://render.com

## Step 3: Deploy (2 minutes)

### If Using Railway:

1. Click **New Project**
2. Click **Deploy from GitHub repo**
3. Select `maninthebox235/hockey-dev-tracker`
4. Railway auto-detects the configuration ✨
5. Click **Variables** tab
6. Add these variables:
   ```
   DATABASE_URL = [paste connection string from Step 1]
   JWT_SECRET = [generate random string, min 32 chars]
   ```
7. Click **Deploy**
8. Wait 2-3 minutes for build
9. Click **Generate Domain** under Settings → Networking

### If Using Render:

1. Click **New** → **Web Service**
2. Connect your GitHub: `maninthebox235/hockey-dev-tracker`
3. Render auto-detects from `render.yaml` ✨
4. Click **Advanced** → **Add Environment Variable**
5. Add:
   ```
   DATABASE_URL = [paste connection string from Step 1]
   JWT_SECRET = [generate random string, min 32 chars]
   ```
6. Click **Create Web Service**
7. Wait 3-4 minutes for build
8. Your app URL will be shown at the top

## Step 4: Verify (30 seconds)

1. Visit your deployed URL
2. Add `/api/health` to the end
3. You should see: `{"status":"ok"}`

Example: `https://your-app.railway.app/api/health`

## Step 5: Start Using! (1 minute)

1. Visit your app URL (without `/api/health`)
2. Sign in with OAuth
3. Create your first player
4. Create a season
5. Upload a video (if S3 configured)

## That's It! 🎉

Your Hockey Development Tracker is now live!

## Optional: Add Video Storage (5 minutes)

To enable video uploads, you need AWS S3:

1. Create S3 bucket in AWS
2. Create IAM user with S3 permissions
3. Add these environment variables to your deployment:
   ```
   AWS_ACCESS_KEY_ID = your-access-key
   AWS_SECRET_ACCESS_KEY = your-secret-key
   AWS_S3_BUCKET = your-bucket-name
   AWS_REGION = us-east-1
   ```
4. Configure S3 CORS (see DEPLOYMENT.md for details)

## Optional: Add AI Features (2 minutes)

To enable AI-powered coaching feedback:

1. Get OpenAI API key from https://platform.openai.com
2. Add to environment variables:
   ```
   OPENAI_API_KEY = your-openai-key
   ```

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify DATABASE_URL is correct
- See TROUBLESHOOTING.md for detailed help

### App Crashes on Start
- Check deployment logs for errors
- Verify database is accessible
- Ensure JWT_SECRET is set

### Can't Connect to Database
- Verify connection string format
- Check if password is correct
- Try direct connection instead of pooled

### Still Having Issues?

1. Check the logs in your deployment platform
2. Read TROUBLESHOOTING.md for detailed solutions
3. Verify all steps above were completed

## What's Next?

- Read DEPLOYMENT.md for advanced configuration
- Set up proper RLS policies in Supabase
- Configure monitoring and alerts
- Add team members
- Customize the app for your needs

## Need Help?

- **Deployment Issues**: See TROUBLESHOOTING.md
- **Database Issues**: See SUPABASE_SETUP.md
- **General Setup**: See DEPLOYMENT.md
- **Code Issues**: Check GitHub repository

## Generate JWT_SECRET

Need a secure random string? Run this in your terminal:

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online
# Visit: https://generate-secret.vercel.app/32
```

## Summary

✅ Get Supabase database password  
✅ Sign up for Railway or Render  
✅ Deploy from GitHub  
✅ Add DATABASE_URL and JWT_SECRET  
✅ Wait for build  
✅ Visit your app!  

**Total time**: ~5 minutes

Enjoy your Hockey Development Tracker! 🏒

