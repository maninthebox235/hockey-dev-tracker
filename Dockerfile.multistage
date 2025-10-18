# Minimal Node.js-only Dockerfile
# Python video analysis will be handled separately or as optional feature

FROM node:22-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production image
FROM node:22-slim

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy application files
COPY drizzle ./drizzle
COPY shared ./shared
COPY storage ./storage

# Create necessary directories
RUN mkdir -p /tmp/uploads /tmp/analysis_results

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run as non-root user
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app /tmp
USER appuser

# Start application
CMD ["node", "dist/index.js"]

