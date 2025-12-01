# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY srv-front/package*.json ./srv-front/
COPY packages/types/package*.json ./packages/types/
COPY packages/contracts/package*.json ./packages/contracts/

# Install dependencies
RUN npm ci

# Copy source code
COPY srv-front/ ./srv-front/
COPY packages/ ./packages/
COPY tsconfig.json ./
COPY turbo.json ./

# Build shared packages
RUN cd packages/types && npm run build
RUN cd packages/contracts && npm run build

# Build Next.js application
WORKDIR /app/srv-front
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./
COPY srv-front/package*.json ./srv-front/
COPY packages/types/package*.json ./packages/types/
COPY packages/contracts/package*.json ./packages/contracts/

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/srv-front/.next ./srv-front/.next
COPY --from=builder /app/srv-front/public ./srv-front/public
COPY --from=builder /app/srv-front/next.config.js ./srv-front/
COPY --from=builder /app/srv-front/package.json ./srv-front/
COPY --from=builder /app/packages ./packages

# Switch to non-root user
USER node

WORKDIR /app/srv-front

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode < 500 ? 0 : 1); }).on('error', () => process.exit(1));"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js application
CMD ["npm", "start"]
