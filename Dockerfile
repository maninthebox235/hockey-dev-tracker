# Multi-stage build for Node.js + Python application
FROM node:22-slim AS base

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and Node dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Install Python dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:22-slim

# Install Python runtime and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application from base stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/drizzle ./drizzle
COPY --from=base /app/python ./python
COPY --from=base /app/shared ./shared
COPY --from=base /app/storage ./storage

# Install Python dependencies in production
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Create directories for uploads and analysis
RUN mkdir -p /tmp/uploads /tmp/analysis_results

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]

