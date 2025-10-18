# Railway Deployment Guide - Hockey Development Tracker

**Complete step-by-step instructions to deploy your application to production**

---

## Prerequisites Checklist

Before starting, ensure you have:

- ✅ GitHub account with the `hockey-dev-tracker` repository
- ✅ Supabase database already set up (Project: `hockey assessment`)
- ✅ Supabase database password (from Database Settings)
- ✅ All code changes pushed to GitHub (latest commit: `614a15b`)

---

## Step 1: Sign Up / Login to Railway

1. Go to **https://railway.app**
2. Click **"Login"** or **"Start a New Project"**
3. Choose **"Login with GitHub"**
4. Authorize Railway to access your GitHub account
5. Select the repositories you want Railway to access (or grant access to all)

---

## Step 2: Create New Project from GitHub

1. Once logged in, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select **`maninthebox235/hockey-dev-tracker`**
4. Railway will automatically detect the configuration from `railway.json`

---

## Step 3: Configure Environment Variables

After Railway creates the project, you need to add environment variables:

### 3.1 Access Variables Settings

1. Click on your deployed service
2. Go to the **"Variables"** tab
3. Click **"Add Variable"** or **"Raw Editor"**

### 3.2 Required Environment Variables

Copy and paste these variables (replace the placeholder values):

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@db.kqdcikqnyatyyfpobrzt.supabase.co:5432/postgres

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-please-change-this

# Node Environment
NODE_ENV=production

# Port (Railway will override this automatically)
PORT=3000
```

### 3.3 Optional Environment Variables (for additional features)

```bash
# AWS S3 for video uploads (optional - add later if needed)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# OpenAI for AI features (optional - add later if needed)
OPENAI_API_KEY=sk-your-openai-api-key

# Analytics (optional)
VITE_ANALYTICS_ID=your-analytics-id
```

### 3.4 How to Get Your Supabase Password

1. Go to **https://supabase.com/dashboard/project/kqdcikqnyatyyfpobrzt/settings/database**
2. Look for **"Database password"** section
3. If you don't remember it, click **"Reset database password"**
4. Copy the new password and save it securely
5. Use it in the `DATABASE_URL` above (replace `[YOUR_SUPABASE_PASSWORD]`)

### 3.5 How to Generate JWT_SECRET

Run this command in your terminal:
```bash
openssl rand -base64 32
```

Or use this online generator: https://generate-secret.vercel.app/32

---

## Step 4: Deploy

1. After adding environment variables, Railway will automatically trigger a deployment
2. Watch the build logs in the **"Deployments"** tab
3. The build should complete in 2-3 minutes

### Expected Build Output:

```
✓ Installing dependencies
✓ Building client (Vite)
✓ Building server (esbuild)
✓ Starting application
✓ Health check passed
```

---

## Step 5: Get Your Public URL

1. Go to the **"Settings"** tab of your service
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. Railway will create a public URL like: `hockey-dev-tracker-production.up.railway.app`
5. Copy this URL - this is your live application!

---

## Step 6: Verify Deployment

### 6.1 Test Health Endpoint

Open in your browser:
```
https://your-app.up.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T...",
  "uptime": 123.456
}
```

### 6.2 Test Main Application

Open in your browser:
```
https://your-app.up.railway.app
```

You should see the Hockey Development Tracker login page!

---

## Step 7: Configure OAuth Callback (Important!)

Since the app uses Manus OAuth for authentication, you need to update the OAuth callback URL:

1. The app currently uses: `https://vidabiz.butterfly-effect.dev`
2. You'll need to update this to your Railway domain
3. Contact Manus support or update the OAuth configuration in your code

**Temporary workaround**: The app will work with the existing OAuth URL for now.

---

## Troubleshooting

### Build Fails

**Check the logs** in Railway's Deployments tab:

1. **"Module not found"** → Run `pnpm install` locally and push to GitHub
2. **"Build timeout"** → Increase timeout in Railway settings
3. **"Out of memory"** → Upgrade Railway plan or optimize build

### App Doesn't Start

**Check environment variables**:
- Ensure `DATABASE_URL` is correct
- Ensure `JWT_SECRET` is at least 32 characters
- Check Railway logs for specific error messages

### Database Connection Fails

**Verify Supabase**:
1. Check password is correct
2. Ensure Supabase project is active
3. Check network restrictions in Supabase (should allow all IPs)
4. Try the connection string locally first

### Static Files Not Loading

**This should be fixed** in the latest code:
- Commit `5c91950` fixed the static file path resolution
- If still broken, check Railway logs for "Serving static files from:" message

---

## Railway Configuration Files

Your repository already includes these files (no changes needed):

### `railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["nodejs-22_x", "pnpm"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]

[phases.build]
cmds = ["pnpm build"]

[start]
cmd = "node dist/index.js"
```

---

## Cost Estimate

Railway pricing (as of 2025):

- **Hobby Plan**: $5/month
  - 500 hours of execution time
  - Perfect for this application
  
- **Pro Plan**: $20/month
  - Unlimited execution time
  - Better for production use

**First deployment is FREE** with Railway's trial!

---

## Post-Deployment Checklist

After successful deployment:

- ✅ Health endpoint returns `{"status":"ok"}`
- ✅ Main page loads without errors
- ✅ CSS and JavaScript files load correctly
- ✅ Can access login page
- ✅ Database connection works
- ✅ No errors in Railway logs

---

## Adding Features Later

### Enable Video Uploads (S3)

1. Create AWS S3 bucket
2. Add AWS credentials to Railway environment variables
3. Redeploy (Railway will auto-deploy on variable changes)

### Enable AI Coaching

1. Get OpenAI API key
2. Add `OPENAI_API_KEY` to Railway environment variables
3. Redeploy

---

## Monitoring & Maintenance

### View Logs

1. Go to Railway dashboard
2. Click on your service
3. Go to **"Deployments"** tab
4. Click on any deployment to see logs

### Restart Service

1. Go to **"Settings"** tab
2. Click **"Restart"** button

### Update Code

1. Push changes to GitHub
2. Railway automatically detects and redeploys
3. Zero-downtime deployment

---

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Supabase Docs**: https://supabase.com/docs
- **Project GitHub**: https://github.com/maninthebox235/hockey-dev-tracker

---

## Quick Reference

### Important URLs

- **Railway Dashboard**: https://railway.app/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/kqdcikqnyatyyfpobrzt
- **GitHub Repo**: https://github.com/maninthebox235/hockey-dev-tracker

### Important Commands

```bash
# Test build locally
pnpm build

# Test production server locally
NODE_ENV=production node dist/index.js

# Check health
curl http://localhost:3000/api/health

# Generate JWT secret
openssl rand -base64 32
```

---

## Summary

1. ✅ Sign up for Railway with GitHub
2. ✅ Create new project from `hockey-dev-tracker` repo
3. ✅ Add environment variables (DATABASE_URL, JWT_SECRET)
4. ✅ Wait for deployment to complete
5. ✅ Generate public domain
6. ✅ Test the application
7. ✅ You're live! 🎉

**Estimated time**: 10-15 minutes

---

**Need help?** Check the troubleshooting section or review the deployment logs in Railway.

**Ready to deploy?** Start at Step 1 above! 🚀

