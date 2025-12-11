# Stage 1: Build Stage
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and lock files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript app
RUN npm run build

# Stage 2: Production Stage
FROM node:18-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json /app/package-lock.json* ./

# Install only production dependencies (but keep prisma for generate)
RUN npm install --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy generated Prisma Client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma Client in production stage (needs DATABASE_URL from env)
RUN npx prisma generate

# Expose the port
EXPOSE 5001

# Health check (using wget as it's available in Alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --timeout=5 -O- http://localhost:5001/health | grep -q 'OK' || exit 1

# Set the command to start the application
CMD ["npm", "run", "start"]