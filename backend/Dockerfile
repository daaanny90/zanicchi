# ============================================================================
# Dockerfile for Freelancer Finance Manager Backend
# ============================================================================
# This Dockerfile creates a production-ready container for the Node.js backend.
# 
# Build stages:
# 1. Builder: Compiles TypeScript to JavaScript
# 2. Production: Runs the compiled application
#
# Multi-stage build reduces final image size by excluding dev dependencies
# and build artifacts.
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1: Builder
# ----------------------------------------------------------------------------
# Uses Node.js 18 Alpine (supports linux/arm/v7)
# Compiles TypeScript code to JavaScript
FROM node:18-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Copy package files first (leverages Docker layer caching)
# Only rebuild if dependencies change
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for TypeScript compiler)
RUN npm ci

# Copy source code
COPY src ./src

# Compile TypeScript to JavaScript
# Output goes to /app/dist directory
RUN npm run build

# ----------------------------------------------------------------------------
# Stage 2: Production
# ----------------------------------------------------------------------------
# Minimal production image with only runtime dependencies
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
# --omit=dev excludes devDependencies
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Copy database initialization scripts
# These may be needed if running migrations from the container
COPY src/database ./src/database

# Create a non-root user for security
# Running as root is a security risk in production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app files to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 3000
# This is informational - actual port binding happens in docker-compose
EXPOSE 3000

# Health check
# Docker will periodically check if the container is healthy
# If health check fails repeatedly, container is marked as unhealthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
# Uses compiled JavaScript from /app/dist
CMD ["node", "dist/server.js"]

