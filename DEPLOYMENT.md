# Deployment Guide

This guide covers deploying the Hockey Development Tracker to various platforms.

## Prerequisites

Before deploying, ensure you have:

1. **Database**: MySQL 8.0+ instance (can use PlanetScale, Railway, or AWS RDS)
2. **Storage**: AWS S3 bucket for video storage (optional but recommended)
3. **OpenAI API Key**: For AI-powered video analysis feedback (optional)

## Environment Variables

The following environment variables must be configured in your deployment platform:

### Required

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/database_name

# Security
JWT_SECRET=your-secure-random-string-min-32-chars

# OAuth
VITE_OAUTH_PORTAL_URL=https://vida.butterfly-effect.dev
OAUTH_SERVER_URL=https://vidabiz.butterfly-effect.dev

# Application
VITE_APP_TITLE=Hockey Development Tracker
VITE_APP_LOGO=/logo.png
PORT=3000
```

### Optional

```bash
# AWS S3 for video storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# OpenAI for AI features
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_API_KEY=your-openai-key

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://your-analytics-endpoint
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides excellent support for full-stack Node.js apps with MySQL.

1. **Create a new project** on [Railway](https://railway.app)

2. **Add MySQL database**:
   - Click "New" → "Database" → "MySQL"
   - Railway will automatically set `DATABASE_URL`

3. **Deploy from GitHub**:
   - Click "New" → "GitHub Repo"
   - Select `maninthebox235/hockey-dev-tracker`
   - Railway will auto-detect the build configuration

4. **Configure environment variables**:
   - Go to your service → "Variables"
   - Add all required environment variables listed above

5. **Set build configuration** (if not auto-detected):
   ```
   Build Command: pnpm install && pnpm build
   Start Command: node dist/index.js
   ```

6. **Run database migrations**:
   - After first deploy, run: `pnpm db:push`
   - You can do this in Railway's terminal or locally with production DATABASE_URL

7. **Generate domain**:
   - Go to "Settings" → "Networking" → "Generate Domain"

### Option 2: Render

1. **Create a new Web Service** on [Render](https://render.com)

2. **Connect GitHub repository**: `maninthebox235/hockey-dev-tracker`

3. **Configure service**:
   ```
   Name: hockey-dev-tracker
   Environment: Node
   Build Command: pnpm install && pnpm build
   Start Command: node dist/index.js
   ```

4. **Add MySQL database**:
   - Create a new MySQL instance in Render
   - Or use external MySQL (PlanetScale, etc.)

5. **Set environment variables** in the Render dashboard

6. **Deploy**: Click "Create Web Service"

### Option 3: Fly.io

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login and launch**:
   ```bash
   fly auth login
   fly launch
   ```

3. **Configure fly.toml** (auto-generated, verify these settings):
   ```toml
   [build]
     dockerfile = "Dockerfile.production"

   [[services]]
     internal_port = 3000
     protocol = "tcp"

   [[services.ports]]
     handlers = ["http"]
     port = 80

   [[services.ports]]
     handlers = ["tls", "http"]
     port = 443
   ```

4. **Set secrets**:
   ```bash
   fly secrets set DATABASE_URL="mysql://..."
   fly secrets set JWT_SECRET="your-secret"
   fly secrets set OPENAI_API_KEY="your-key"
   # ... add all other environment variables
   ```

5. **Deploy**:
   ```bash
   fly deploy
   ```

### Option 4: Vercel (Frontend + Serverless Functions)

⚠️ **Note**: Vercel is optimized for serverless, not long-running processes. Video analysis may timeout.

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Configure**:
   - Add environment variables in Vercel dashboard
   - Vercel will build automatically using `package.json` scripts

4. **Limitations**:
   - Serverless functions have 10s timeout (Hobby) or 60s (Pro)
   - Video analysis may need to be moved to separate service

## Database Setup

After deploying, initialize the database:

```bash
# If you have pnpm installed locally with DATABASE_URL set:
pnpm db:push

# Or connect to your deployment and run:
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Dockerfile Options

The project includes multiple Dockerfile configurations:

- **`Dockerfile.production`** (Recommended): Multi-stage build with optimizations
- **`Dockerfile.multistage`**: Alternative multi-stage configuration
- **`Dockerfile`** or **`Dockerfile.simple`**: Simple single-stage build

Most platforms will auto-detect `Dockerfile`, but you can specify:
- Railway: Auto-detects Dockerfile
- Render: Set "Docker Command" to use specific Dockerfile
- Fly.io: Specify in `fly.toml`

## Troubleshooting

### Build Failures

1. **Check build logs** for specific errors
2. **Verify environment variables** are set correctly
3. **Ensure DATABASE_URL** is accessible from deployment
4. **Check Node.js version**: Requires Node 20+

### Common Issues

**Issue**: "exit status 1" with no details
- **Solution**: Check platform-specific logs (not just build logs)
- Enable verbose logging if available

**Issue**: Database connection fails
- **Solution**: Verify DATABASE_URL format and network access
- Check if database allows connections from deployment IP

**Issue**: Large bundle size warnings
- **Solution**: These are warnings, not errors. App will still work.
- Consider code-splitting for optimization (future enhancement)

**Issue**: Video upload fails
- **Solution**: Ensure AWS S3 credentials are set
- Check CORS configuration on S3 bucket

### Health Check

The app includes a health check endpoint at `/api/health`:

```bash
curl https://your-domain.com/api/health
```

Should return: `{"status":"ok"}`

## Post-Deployment

1. **Test the application**:
   - Create a test player
   - Create a test season
   - Upload a small test video

2. **Configure S3 CORS** (if using S3):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://your-domain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

3. **Set up monitoring**:
   - Most platforms provide built-in monitoring
   - Monitor database connections and storage usage

## Scaling Considerations

For production use with many users:

1. **Database**: Use connection pooling (already configured in code)
2. **Storage**: S3 handles scaling automatically
3. **Video Analysis**: Consider moving to separate microservice
4. **CDN**: Use CloudFlare or similar for static assets

## Support

For deployment issues:
- Check platform-specific documentation
- Review build logs carefully
- Ensure all environment variables are set
- Test database connectivity separately

