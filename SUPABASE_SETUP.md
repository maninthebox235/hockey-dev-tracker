# Supabase Database Setup

The Hockey Development Tracker database has been successfully migrated to Supabase!

## Database Details

- **Project ID**: `kqdcikqnyatyyfpobrzt`
- **Project Name**: hockey assessment
- **Region**: us-east-2
- **Status**: ACTIVE_HEALTHY
- **Database Host**: db.kqdcikqnyatyyfpobrzt.supabase.co
- **API URL**: https://kqdcikqnyatyyfpobrzt.supabase.co

## Database Schema

The following tables have been created:

1. **users** - User authentication and profiles
2. **players** - Hockey player information
3. **seasons** - Season tracking
4. **player_season_metrics** - Player performance metrics per season
5. **videos** - Uploaded video metadata
6. **video_feedback** - AI-generated coaching feedback
7. **video_players** - Association between videos and players
8. **videoAnalysisResults** - Computer vision analysis results

All tables have:
- Row Level Security (RLS) enabled
- Proper indexes for performance
- Foreign key constraints for data integrity

## Connection String Format

For PostgreSQL/Supabase, the connection string format is:

```
postgresql://postgres.[project-ref]:[password]@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

You'll need to get your database password from the Supabase dashboard:
1. Go to https://supabase.com/dashboard/project/kqdcikqnyatyyfpobrzt
2. Navigate to Settings → Database
3. Copy the connection string under "Connection string" → "URI"

## Environment Variables for Deployment

Update your deployment platform with these environment variables:

```bash
# Database - Get the full connection string from Supabase dashboard
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-2.pooler.supabase.com:6543/postgres

# Or use direct connection (not pooled):
# DATABASE_URL=postgresql://postgres:[password]@db.kqdcikqnyatyyfpobrzt.supabase.co:5432/postgres

# Application
VITE_APP_TITLE=Hockey Development Tracker
VITE_APP_LOGO=/logo.png

# OAuth
VITE_OAUTH_PORTAL_URL=https://vida.butterfly-effect.dev
OAUTH_SERVER_URL=https://vidabiz.butterfly-effect.dev

# Security
JWT_SECRET=your-secure-random-string-min-32-chars

# OpenAI (optional)
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_API_KEY=your-openai-key

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## Converting from MySQL to PostgreSQL

The app was originally built for MySQL but now uses PostgreSQL/Supabase. The key differences handled in the migration:

1. **ENUM types**: Converted to VARCHAR with CHECK constraints
2. **Timestamps**: Using `TIMESTAMP WITH TIME ZONE` instead of MySQL's `timestamp`
3. **Boolean**: Native PostgreSQL BOOLEAN instead of MySQL's TINYINT
4. **Auto-increment**: Not needed as app uses nanoid for IDs

## Database Driver Configuration

The app uses `mysql2` driver, which needs to be updated for PostgreSQL. You have two options:

### Option 1: Use PostgreSQL Driver (Recommended)

Update `package.json`:
```json
{
  "dependencies": {
    "postgres": "^3.4.3",
    // Remove: "mysql2": "^3.15.0"
  }
}
```

Update `server/db.ts` to use `postgres` instead of `mysql2`.

### Option 2: Keep MySQL Driver with Compatibility Layer

Some platforms (like Supabase) support MySQL protocol over PostgreSQL. Check if this is available.

## Row Level Security (RLS) Policies

Currently, all tables have permissive policies that allow:
- Authenticated users: Full access (SELECT, INSERT, UPDATE, DELETE)
- Service role: Full access

**For production**, you should tighten these policies based on your requirements:

```sql
-- Example: Users can only see their own data
CREATE POLICY "Users can view own data" 
  ON videos FOR SELECT 
  TO authenticated 
  USING (auth.uid() = "uploadedBy");
```

## Next Steps

1. **Get Database Password**:
   - Visit Supabase dashboard
   - Copy the connection string

2. **Update App Configuration**:
   - Set DATABASE_URL in deployment platform
   - Update database driver if needed

3. **Test Connection**:
   - Deploy the app
   - Verify database connectivity
   - Create test data

4. **Optional: Update to PostgreSQL Driver**:
   - For better performance and features
   - See Option 1 above

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check connection string format**:
   - Use pooled connection for serverless: `pooler.supabase.com:6543`
   - Use direct connection for long-running: `db.*.supabase.co:5432`

2. **Verify SSL settings**:
   - Supabase requires SSL
   - Add `?sslmode=require` to connection string if needed

3. **Check IP allowlist**:
   - Supabase allows all IPs by default
   - Verify in Settings → Database → Connection pooling

### Query Compatibility

If you encounter SQL errors:

1. **MySQL vs PostgreSQL syntax**:
   - MySQL: \`backticks\` for identifiers
   - PostgreSQL: "double quotes" for identifiers

2. **Case sensitivity**:
   - PostgreSQL is case-sensitive for identifiers
   - Use exact casing as defined in schema

3. **Data types**:
   - Check ENUM handling
   - Verify timestamp formats

## Support

For Supabase-specific issues:
- Documentation: https://supabase.com/docs
- Dashboard: https://supabase.com/dashboard/project/kqdcikqnyatyyfpobrzt
- Support: https://supabase.com/support

