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

# Build the Next.js app
RUN npm run build

# Stage 2: Production Stage
FROM node:18-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy necessary files from the build stage
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose Next.js default port
EXPOSE 3000

# Set the command to start the application
CMD ["npm", "run", "start"]