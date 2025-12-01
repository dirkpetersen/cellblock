# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY srv-back/package*.json ./srv-back/
COPY packages/types/package*.json ./packages/types/
COPY packages/contracts/package*.json ./packages/contracts/

# Install dependencies
RUN npm ci

# Copy source code
COPY srv-back/ ./srv-back/
COPY packages/ ./packages/
COPY tsconfig.json ./
COPY turbo.json ./

# Generate Prisma client
RUN cd srv-back && npx prisma generate

# Build application
RUN cd srv-back && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./
COPY srv-back/package*.json ./srv-back/
COPY packages/types/package*.json ./packages/types/
COPY packages/contracts/package*.json ./packages/contracts/

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/srv-back/dist ./srv-back/dist
COPY --from=builder /app/srv-back/prisma ./srv-back/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/packages ./packages

# Create directories for keys and logs
RUN mkdir -p /app/keys /app/logs && \
    chown -R node:node /app

# Switch to non-root user
USER node

WORKDIR /app/srv-back

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]
