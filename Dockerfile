# Optimized Dockerfile for Node.js + Python deployment
# Uses pre-built wheels and minimal dependencies

FROM node:22-slim AS builder

# Install minimal build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install Node.js dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production image
FROM node:22-slim

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy application files
COPY drizzle ./drizzle
COPY python ./python
COPY shared ./shared
COPY storage ./storage

# Install Python dependencies with pre-built wheels (no compilation)
RUN pip3 install --no-cache-dir --only-binary=:all: \
    ultralytics \
    opencv-python-headless \
    numpy \
    pillow \
    || pip3 install --no-cache-dir \
    ultralytics \
    opencv-python-headless

# Create necessary directories
RUN mkdir -p /tmp/uploads /tmp/analysis_results

# Set environment variables
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run as non-root user for security
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app /tmp
USER appuser

# Start application
CMD ["node", "dist/index.js"]

