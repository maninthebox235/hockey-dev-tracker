# Optimized multi-stage build for Node.js + Python application
FROM node:22-alpine AS base

# Install build dependencies
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency files first for better caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Build stage
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 py3-pip
RUN npm install -g pnpm

WORKDIR /app

# Copy dependencies from base
COPY --from=base /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./

# Install dev dependencies for build
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine

# Install Python runtime and minimal dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-numpy \
    py3-pillow \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/python ./python
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/storage ./storage

# Install Python dependencies (lightweight versions)
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages || \
    pip3 install --no-cache-dir ultralytics opencv-python-headless --break-system-packages

# Create directories
RUN mkdir -p /tmp/uploads /tmp/analysis_results

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]

