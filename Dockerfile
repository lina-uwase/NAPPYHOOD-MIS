# Use Node.js 20 official image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm ci

# Copy backend source code
COPY backend/ ./backend/

# Build the application
RUN cd backend && npm run build

# Generate Prisma client
RUN cd backend && npx prisma generate

# Expose port
EXPOSE 5001

# Start script
CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && (npm run seed || echo 'Seeding failed, continuing...') && npm start"]