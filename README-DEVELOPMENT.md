# Nappyhood MIS Development Guide

## Quick Start

### Admin Credentials
- **Email**: nappyhood.boutique@gmail.com
- **Password**: HairIs@2030

### Local Development Setup

1. **Install dependencies:**
   ```bash
   cd web && npm install
   cd ../backend && npm install
   ```

2. **Start local development (Docker):**
   ```bash
   ./deploy.sh
   ```

3. **Access locally:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
   - Health Check: http://localhost:5001/health

### Server Deployment

Use the deployment script to push changes:

```bash
# Deploy frontend changes only
./server-deploy.sh frontend

# Deploy backend changes only  
./server-deploy.sh backend

# Deploy everything
./server-deploy.sh full

# Check server status
./server-deploy.sh status
```

### Production Access
- Frontend: https://nappyhood.com
- Backend API: https://nappyhood.com/api
- Server SSH: `ssh -p 222 root@41.186.186.178`

### Recent Fixes Applied

✅ **Sales Date Issues Fixed:**
- Removed manual date input - now auto-generated
- Date shows current date with time set on creation
- Displays full date/time and recorder after sale creation

✅ **Customer Visit Tracking Fixed:**
- Removed "Visit #" display from sales
- Fixed visit counting logic for new customers

✅ **Admin Credentials Updated:**
- New admin email: nappyhood.boutique@gmail.com
- New password: HairIs@2030

### Development Workflow

1. Make changes locally
2. Test with `npm run build` in web directory
3. Deploy with `./server-deploy.sh frontend` or `./server-deploy.sh backend`
4. Verify with `./server-deploy.sh status`

### Troubleshooting

- **Local build fails**: Check `web/package.json` dependencies
- **Server deployment fails**: Verify SSH connection with `ssh -p 222 root@41.186.186.178`
- **Database issues**: Run `docker-compose logs backend` on server
- **Frontend issues**: Run `docker-compose logs frontend` on server
