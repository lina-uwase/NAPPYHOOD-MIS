# Nappyhood Salon MIS - Deployment Guide

## Project Overview
This is a full-stack salon management system with:
- **Frontend**: Next.js application (Port 3000)
- **Backend**: Node.js/TypeScript API (Port 5001)
- **Database**: PostgreSQL

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### Deployment Steps

1. **Clone and navigate to the project:**
   ```bash
   git clone <your-repo-url>
   cd "NAPPYHOOD MIS"
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your actual values
   ```

3. **Build and start all services:**
   ```bash
   docker-compose up -d --build
   ```

4. **Run database migrations (first time only):**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npx prisma generate
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
   - API Health Check: http://localhost:5001/health

### Environment Variables

Essential variables to configure in `.env.production`:
- `POSTGRES_PASSWORD`: Secure password for PostgreSQL
- `JWT_SECRET`: Secure secret key for JWT tokens
- `NEXT_PUBLIC_API_URL`: Backend URL for frontend

### Manual Deployment

#### Backend
```bash
cd backend
npm install
npm run build
npm start
```

#### Frontend
```bash
cd web
npm install
npm run build
npm start
```

### Hosting Options

#### Option 1: VPS/Cloud Server
- Deploy using docker-compose on any VPS
- Use nginx as reverse proxy
- Set up SSL certificates

#### Option 2: Platform-as-a-Service
- **Frontend**: Deploy to Vercel, Netlify
- **Backend**: Deploy to Railway, Render, Heroku
- **Database**: Use managed PostgreSQL (Supabase, Neon, etc.)

#### Option 3: Cloud Native
- Deploy to AWS, GCP, or Azure
- Use container services (ECS, Cloud Run, Container Apps)
- Use managed databases

### Production Considerations

1. **Security:**
   - Change default passwords
   - Use strong JWT secrets
   - Set up HTTPS
   - Configure CORS properly

2. **Performance:**
   - Set up database connection pooling
   - Configure caching
   - Use CDN for static assets

3. **Monitoring:**
   - Set up logging
   - Configure health checks
   - Monitor resource usage

### Backup and Maintenance

- Regular database backups
- Update dependencies regularly
- Monitor logs for errors
- Test deployments in staging environment

### Troubleshooting

Common issues:
- Database connection errors: Check DATABASE_URL
- CORS issues: Verify API_URL settings
- Build failures: Check Node.js version compatibility