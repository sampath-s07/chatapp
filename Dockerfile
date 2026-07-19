# Use Node.js 20 LTS Alpine (small image)
FROM node:20-alpine AS base

# Install dependencies needed for better-sqlite3 native build
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDeps for build)
RUN npm ci

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# ---- Production image ----
FROM node:20-alpine AS runner

RUN apk add --no-cache python3 make g++

WORKDIR /app

ENV NODE_ENV=production

# Copy built assets from base
COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/server.js ./server.js
COPY --from=base /app/next.config.js ./next.config.js
COPY --from=base /app/lib ./lib

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD wget -qO- http://localhost:3000 || exit 1

# Start the custom server
CMD ["node", "server.js"]
