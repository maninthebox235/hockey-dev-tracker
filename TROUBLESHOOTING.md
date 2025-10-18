# Deployment Troubleshooting Guide

This guide helps diagnose and fix common deployment issues for the Hockey Development Tracker.

## Quick Diagnosis Checklist

Before diving into specific issues, verify:

- [ ] Node.js version is 20+ (check platform settings)
- [ ] All required environment variables are set
- [ ] DATABASE_URL is accessible from deployment
- [ ] Build completes successfully locally (`pnpm build`)
- [ ] `dist/index.js` and `dist/public/` exist after build

## Common Issues and Solutions

### Issue 1: "exit status 1" with No Details

**Symptoms:**
- Build fails with generic "exit status 1"
- No detailed error messages in logs

**Possible Causes:**
1. Missing environment variables during build
2. Out of memory during build
3. Network timeout during dependency installation
4. Wrong Node.js version

**Solutions:**

1. **Check Node.js version:**
   - Ensure platform is using Node 20 or higher
   - Add to configuration: `"engines": { "node": ">=20.0.0" }`

2. **Increase build resources:**
   - Railway: Upgrade to Pro for more build resources
   - Render: Use paid tier for better build performance

3. **Simplify build:**
   - Use `Dockerfile.simple` instead of multi-stage
   - Reduce concurrent builds

4. **Add build logging:**
   ```bash
   # In package.json, modify build script:
   "build": "echo 'Starting Vite build...' && vite build && echo 'Starting esbuild...' && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist && echo 'Build complete!'"
   ```

### Issue 2: Build Succeeds but App Crashes on Start

**Symptoms:**
- Build completes successfully
- App crashes immediately on startup
- Health check fails

**Possible Causes:**
1. Missing runtime dependencies
2. Database connection fails
3. Static files not found
4. Port binding issues

**Solutions:**

1. **Check startup logs:**
   - Look for "Serving static files from:" message
   - Verify path matches actual file location

2. **Test database connection:**
   ```bash
   # In deployment terminal:
   node -e "require('mysql2').createConnection(process.env.DATABASE_URL).connect(err => console.log(err || 'Connected!'))"
   ```

3. **Verify file structure:**
   ```bash
   # In deployment terminal:
   ls -la dist/
   ls -la dist/public/
   ```

4. **Check port configuration:**
   - Ensure PORT environment variable is set
   - Some platforms auto-set PORT (Railway, Render)

### Issue 3: Static Files Not Loading (404 errors)

**Symptoms:**
- App starts successfully
- HTML loads but CSS/JS return 404
- Blank white page

**Possible Causes:**
1. Incorrect static file path
2. Build artifacts not copied correctly
3. Permissions issues

**Solutions:**

1. **Verify build output:**
   ```bash
   # Should show index.html and assets/
   ls -la dist/public/
   ```

2. **Check Dockerfile COPY commands:**
   - Ensure `dist/public` is copied to production image
   - Verify paths in multi-stage builds

3. **Test static serving locally:**
   ```bash
   NODE_ENV=production node dist/index.js
   # Visit http://localhost:3000
   ```

### Issue 4: Database Connection Fails

**Symptoms:**
- "ECONNREFUSED" or "ETIMEDOUT" errors
- "Access denied" errors
- App starts but database queries fail

**Possible Causes:**
1. Incorrect DATABASE_URL format
2. Database not accessible from deployment
3. SSL/TLS configuration issues
4. Connection limit reached

**Solutions:**

1. **Verify DATABASE_URL format:**
   ```
   mysql://username:password@host:port/database
   
   # With SSL (PlanetScale, etc.):
   mysql://username:password@host:port/database?ssl={"rejectUnauthorized":true}
   ```

2. **Test connection separately:**
   ```bash
   # Install mysql client in deployment:
   mysql -h host -u user -p database
   ```

3. **Check firewall rules:**
   - Ensure database allows connections from deployment IPs
   - Railway/Render: Usually auto-configured
   - External DB: Add deployment IPs to allowlist

4. **Enable connection pooling:**
   - Already configured in code
   - Increase pool size if needed in `server/db.ts`

### Issue 5: Environment Variables Not Working

**Symptoms:**
- Variables show as "undefined" in logs
- Features that require env vars don't work
- Build-time variables missing

**Possible Causes:**
1. Variables not set in platform
2. Wrong variable names (typos)
3. Build-time vs runtime confusion
4. Variables not exposed to build process

**Solutions:**

1. **Verify variable names:**
   - Check `.env.example` for correct names
   - No typos in platform configuration

2. **Understand build-time vs runtime:**
   - `VITE_*` variables: Build-time only
   - Other variables: Runtime
   - Build-time vars must be set before/during build

3. **Platform-specific configuration:**
   
   **Railway:**
   - Set in "Variables" tab
   - Automatically available to build and runtime
   
   **Render:**
   - Set in "Environment" section
   - Choose "Build" or "Runtime" scope
   
   **Fly.io:**
   - Use `fly secrets set KEY=value`
   - Secrets available at runtime only

4. **Test variable availability:**
   ```bash
   # In deployment terminal:
   echo $DATABASE_URL
   node -e "console.log(process.env.DATABASE_URL)"
   ```

### Issue 6: Large Bundle Size Warnings

**Symptoms:**
- Warning: "Some chunks are larger than 500 kB"
- Slow initial page load

**Note:** This is a warning, not an error. The app will still work.

**Solutions (Optional Optimization):**

1. **Enable code splitting:**
   ```typescript
   // In vite.config.ts, add:
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'react-vendor': ['react', 'react-dom'],
           'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
         }
       }
     }
   }
   ```

2. **Use dynamic imports:**
   ```typescript
   // Instead of:
   import VideoAnalysis from './VideoAnalysis';
   
   // Use:
   const VideoAnalysis = lazy(() => import('./VideoAnalysis'));
   ```

### Issue 7: Video Upload Fails

**Symptoms:**
- Video upload returns error
- Files don't appear in S3
- Upload progress stalls

**Possible Causes:**
1. Missing AWS credentials
2. Incorrect S3 bucket configuration
3. CORS issues
4. File size limits

**Solutions:**

1. **Verify AWS credentials:**
   ```bash
   # Check if set:
   echo $AWS_ACCESS_KEY_ID
   echo $AWS_SECRET_ACCESS_KEY
   echo $AWS_S3_BUCKET
   ```

2. **Configure S3 CORS:**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://your-domain.com", "http://localhost:3000"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

3. **Check S3 bucket policy:**
   - Ensure IAM user has `s3:PutObject` permission
   - Bucket must allow uploads from app

4. **Increase upload limits:**
   - Already set to 1GB in code
   - Check platform-specific limits (Cloudflare, etc.)

### Issue 8: Python/Video Analysis Not Working

**Symptoms:**
- Video analysis fails or times out
- "Python not found" errors
- YOLOv8 model errors

**Note:** The main app is Node.js only. Video analysis is optional.

**Solutions:**

1. **Deploy video analysis separately:**
   - See `video-analysis-service/` directory
   - Deploy as separate microservice
   - Update `MICROSERVICE_URL` in main app

2. **Use Docker with Python:**
   - Create multi-language Dockerfile
   - Install Python and dependencies
   - May increase build time significantly

3. **Disable video analysis:**
   - App works without it
   - Videos upload but won't be analyzed
   - Manual analysis can be added later

## Platform-Specific Issues

### Railway

**Issue:** Build succeeds but deploy fails
- **Solution:** Check "Deploy Logs" (separate from Build Logs)
- **Solution:** Verify DATABASE_URL is connected

**Issue:** Port already in use
- **Solution:** Railway auto-sets PORT, don't hardcode it
- **Solution:** Use `process.env.PORT || 3000`

### Render

**Issue:** Build timeout
- **Solution:** Upgrade to paid tier
- **Solution:** Use Docker deploy instead of native

**Issue:** Database connection from different region
- **Solution:** Create database in same region as web service
- **Solution:** Use connection pooling (already enabled)

### Fly.io

**Issue:** Secrets not available during build
- **Solution:** Use `--build-arg` for build-time secrets
- **Solution:** Set runtime secrets with `fly secrets set`

**Issue:** Health check fails
- **Solution:** Ensure app binds to `0.0.0.0`, not `localhost`
- **Solution:** Already configured correctly in code

## Getting More Help

1. **Enable verbose logging:**
   ```typescript
   // In server/_core/index.ts, add:
   console.log('Environment:', process.env.NODE_ENV);
   console.log('Port:', process.env.PORT);
   console.log('Database:', process.env.DATABASE_URL ? 'Connected' : 'Not set');
   ```

2. **Test locally in production mode:**
   ```bash
   NODE_ENV=production pnpm build
   NODE_ENV=production node dist/index.js
   ```

3. **Check platform status pages:**
   - Railway: https://railway.app/status
   - Render: https://status.render.com
   - Fly.io: https://status.flyio.net

4. **Review platform-specific logs:**
   - Build logs
   - Deploy logs
   - Runtime logs
   - Database logs (if available)

## Still Having Issues?

If you've tried everything above:

1. **Simplify the deployment:**
   - Use `Dockerfile.simple`
   - Remove optional features temporarily
   - Test with minimal configuration

2. **Try a different platform:**
   - If Railway fails, try Render
   - If both fail, try Fly.io
   - Each has different build systems

3. **Check the repository:**
   - Ensure you have latest code
   - Check for open issues on GitHub
   - Review recent commits for fixes

4. **Create a minimal reproduction:**
   - Start with basic Node.js app
   - Add features incrementally
   - Identify what breaks deployment

