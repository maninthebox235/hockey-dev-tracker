# Free Deployment Options for Hockey Development Tracker

Since Railway requires a paid plan ($5/month), here are **completely free** alternatives to deploy your Hockey Development Tracker:

---

## Option 1: Render (Recommended - Free Forever)

**Best for**: Production deployments with zero cost

### Steps:

1. **Sign up at Render**: https://render.com
2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select `maninthebox235/hockey-dev-tracker`
3. **Configure**:
   - **Name**: `hockey-dev-tracker`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/index.js`
4. **Add Environment Variables**:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.kqdcikqnyatyyfpobrzt.supabase.co:5432/postgres
   JWT_SECRET=tdD1lJM6JzkxqlBrX+ikYhV1q7PmKjWBbqV7D9X5JPk=
   NODE_ENV=production
   PORT=3000
   ```
5. **Deploy**: Click "Create Web Service"

### Free Tier Limits:
- ✅ 750 hours/month (enough for 24/7)
- ✅ 512 MB RAM
- ✅ Custom domains supported
- ⚠️ Spins down after 15 minutes of inactivity (cold starts)

---

## Option 2: Fly.io (Free Tier)

**Best for**: Always-on deployments with better performance

### Steps:

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Deploy from your project**:
   ```bash
   cd /path/to/hockey-dev-tracker
   fly launch --dockerfile Dockerfile.production
   ```

4. **Set Environment Variables**:
   ```bash
   fly secrets set DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.kqdcikqnyatyyfpobrzt.supabase.co:5432/postgres"
   fly secrets set JWT_SECRET="tdD1lJM6JzkxqlBrX+ikYhV1q7PmKjWBbqV7D9X5JPk="
   fly secrets set NODE_ENV="production"
   ```

5. **Deploy**:
   ```bash
   fly deploy
   ```

### Free Tier Limits:
- ✅ 3 shared-cpu-1x VMs
- ✅ 3GB persistent storage
- ✅ 160GB outbound data transfer
- ✅ No cold starts (always on)

---

## Option 3: Vercel (With Adapter)

**Best for**: Serverless deployment (requires code changes)

Vercel doesn't natively support long-running Node servers, but you can:

1. Convert the Express app to serverless functions
2. Use Vercel's edge runtime
3. Deploy with zero configuration

**Note**: This requires refactoring the application architecture.

---

## Option 4: Koyeb (Free Tier)

**Best for**: Simple Docker deployments

### Steps:

1. **Sign up**: https://www.koyeb.com
2. **Create Service**:
   - Click "Create Service"
   - Choose "GitHub"
   - Select `maninthebox235/hockey-dev-tracker`
3. **Configure**:
   - **Builder**: Docker
   - **Dockerfile**: `Dockerfile.production`
   - **Port**: 3000
4. **Add Environment Variables** (same as above)
5. **Deploy**

### Free Tier Limits:
- ✅ 512 MB RAM
- ✅ 2.5 GB disk
- ✅ Always on (no cold starts)

---

## Option 5: Cyclic (Free Tier)

**Best for**: Quick deployments with minimal config

### Steps:

1. **Sign up**: https://www.cyclic.sh
2. **Connect GitHub**: Link your `hockey-dev-tracker` repo
3. **Auto-deploy**: Cyclic automatically detects Node.js and builds
4. **Add Environment Variables** in the dashboard

### Free Tier Limits:
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ 10,000 requests/month
- ⚠️ Cold starts after inactivity

---

## Comparison Table

| Platform | Free Tier | Cold Starts | Custom Domain | Best For |
|----------|-----------|-------------|---------------|----------|
| **Render** | ✅ 750hrs/mo | ⚠️ Yes (15min) | ✅ Yes | Production |
| **Fly.io** | ✅ 3 VMs | ✅ No | ✅ Yes | Always-on |
| **Koyeb** | ✅ 512MB RAM | ✅ No | ✅ Yes | Docker apps |
| **Cyclic** | ✅ 10k req/mo | ⚠️ Yes | ✅ Yes | Quick deploy |
| **Railway** | ❌ Trial ended | ✅ No | ✅ Yes | Paid only |

---

## Recommended: Render

**Why Render?**
- ✅ Completely free forever
- ✅ Easy GitHub integration
- ✅ Supports your `render.yaml` config
- ✅ Great for production apps
- ✅ 750 hours = 24/7 uptime

**Only downside**: 15-minute inactivity = cold start (1-2 seconds to wake up)

---

## Quick Start with Render

### 1. Create Account
Visit: https://render.com/register

### 2. New Web Service
- Dashboard → "New +" → "Web Service"
- Connect GitHub → Select `hockey-dev-tracker`

### 3. Configuration
Render will auto-detect your `render.yaml` file!

Just add these environment variables:
```
DATABASE_URL=postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@db.kqdcikqnyatyyfpobrzt.supabase.co:5432/postgres
JWT_SECRET=tdD1lJM6JzkxqlBrX+ikYhV1q7PmKjWBbqV7D9X5JPk=
NODE_ENV=production
```

### 4. Deploy
Click "Create Web Service" and wait 2-3 minutes!

### 5. Your Live URL
You'll get: `https://hockey-dev-tracker.onrender.com`

---

## Already Configured Files

Your repository already includes:

✅ `render.yaml` - Render configuration  
✅ `Dockerfile.production` - Docker build  
✅ `railway.json` - Railway config (if you upgrade)  
✅ `nixpacks.toml` - Railway build config  

**No code changes needed!** Just deploy.

---

## Need Help?

1. **Render Docs**: https://render.com/docs
2. **Fly.io Docs**: https://fly.io/docs
3. **Project Issues**: https://github.com/maninthebox235/hockey-dev-tracker/issues

---

## Summary

**For immediate free deployment**:
1. Go to https://render.com
2. Sign up with GitHub
3. Create Web Service from `hockey-dev-tracker` repo
4. Add environment variables
5. Deploy!

**Total time**: 5-10 minutes  
**Cost**: $0 forever  
**Uptime**: 24/7 (with cold starts)

---

**Ready to deploy?** I recommend starting with Render - it's the easiest and most reliable free option!

