# Deploy Hockey Development Tracker Without Credit Card

Unfortunately, Render requires a credit card even for their free tier. Here are your **truly free alternatives** that don't require payment information.

---

## Option 1: Keep Using the Manus Preview (Temporary)

**Current Link**: https://3001-i52athtxltu4w9liqz3jl-bc399857.manusvm.computer

**Pros:**
- ✅ Already running
- ✅ No setup needed
- ✅ Fully functional with database

**Cons:**
- ❌ Link expires when session ends
- ❌ Not permanent

---

## Option 2: Deploy to Fly.io (Free, No Card Required Initially)

Fly.io offers a free tier without requiring a credit card upfront.

### Quick Deploy Steps:

1. **Install Fly CLI** (on your local machine):
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Sign up**:
   ```bash
   fly auth signup
   ```

3. **Navigate to project**:
   ```bash
   cd /path/to/hockey-dev-tracker
   ```

4. **Launch app**:
   ```bash
   fly launch
   ```

5. **Set environment variables**:
   ```bash
   fly secrets set DATABASE_URL="postgresql://postgres:!#;GC1)ntb]$*pi!3HBC@db.kqdcikqnyatyyfpobrzt.supabase.co:5432/postgres"
   fly secrets set JWT_SECRET="tdD1lJM6JzkxqlBrX+ikYhV1q7PmKjWBbqV7D9X5JPk="
   fly secrets set NODE_ENV="production"
   ```

6. **Deploy**:
   ```bash
   fly deploy
   ```

**Free Tier Includes:**
- 3 shared-cpu-1x VMs with 256MB RAM each
- 3GB persistent volume storage
- 160GB outbound data transfer

---

## Option 3: Self-Host on Your Own Server

If you have access to a VPS or home server:

### Using Docker:

```bash
# Clone the repo
git clone https://github.com/maninthebox235/hockey-dev-tracker.git
cd hockey-dev-tracker

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:!#;GC1)ntb]$*pi!3HBC@db.kqdcikqnyatyyfpobrzt.supabase.co:5432/postgres
JWT_SECRET=tdD1lJM6JzkxqlBrX+ikYhV1q7PmKjWBbqV7D9X5JPk=
NODE_ENV=production
PORT=3000
EOF

# Build and run
docker build -t hockey-tracker -f Dockerfile.production .
docker run -d -p 3000:3000 --env-file .env hockey-tracker
```

### Without Docker:

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Start
NODE_ENV=production node dist/index.js
```

---

## Option 4: Add Credit Card to Render (Still Free)

If you're comfortable adding a card for verification:

1. **Important**: Render's free tier is truly free - you won't be charged
2. The card is only for identity verification
3. You can set billing alerts at $0 to be notified of any charges
4. You can remove the card after deployment if desired

**To complete Render deployment:**
1. Go back to: https://dashboard.render.com/web/new
2. Configure as before (already saved)
3. Add payment card when prompted
4. Deploy

---

## Option 5: Railway with $5/month

If you're willing to pay a small amount:

**Railway Hobby Plan**: $5/month
- More reliable than free tiers
- Better performance
- No cold starts
- Worth it for a production app

---

## Recommendation

**For immediate use**: Keep using the Manus preview link (already working!)

**For permanent deployment**:
- **Best free option**: Fly.io (no card required initially)
- **Best paid option**: Railway $5/month (most reliable)
- **DIY option**: Self-host if you have a server

---

## Current Status

✅ **Application**: Production-ready  
✅ **Database**: Supabase configured  
✅ **Environment**: All variables prepared  
✅ **Preview**: Running at https://3001-i52athtxltu4w9liqz3jl-bc399857.manusvm.computer  

**You're 90% there!** Just need to choose a deployment platform.

---

## Need Help?

Let me know which option you'd like to pursue and I can provide detailed step-by-step instructions!

