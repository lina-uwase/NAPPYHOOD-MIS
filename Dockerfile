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

# Create startup script
RUN echo '#!/bin/sh\ncd backend\necho "🔧 Starting migrations..."\nnpx prisma migrate deploy || echo "⚠️ Migration failed"\necho "🌱 Starting seeding..."\nnpm run seed || echo "⚠️ Seeding failed"\necho "🚀 Starting server..."\nexec npm start' > /start.sh && chmod +x /start.sh

# Start with the script
CMD ["/start.sh"]