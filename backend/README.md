# Nappyhood Salon Management System - Backend API

A comprehensive salon management system backend built with Node.js, TypeScript, Express, Prisma, and PostgreSQL.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 👥 **Customer Management** - Registration, visit tracking, loyalty points
- 💇‍♀️ **Service Management** - Complete salon service catalog with pricing
- 📅 **Visit Tracking** - Record customer visits with multiple services and staff
- 💰 **Automated Discounts** - 6th visit, birthday month, service combos
- 📊 **Staff Performance** - Track staff productivity and revenue
- 📈 **Analytics Dashboard** - Revenue trends, top services, customer insights
- 🎯 **Loyalty System** - Points earning and discount eligibility

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/NAPPYHOOD"
   JWT_SECRET="your_jwt_secret_key_here"
   PORT=5000
   NODE_ENV=development
   ```

4. **Set up database:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate

   # Seed database with sample data
   npm run seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## Default Login Credentials

After seeding, you can use these credentials:

- **Admin**: `admin@nappyhood.com` / `admin123`
- **Manager**: `manager@nappyhood.com` / `manager123`
- **Staff**: `stylist1@nappyhood.com` / `staff123`
- **Staff**: `stylist2@nappyhood.com` / `staff123`

## API Endpoints

### Health Check
- `GET /health` - API health status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `POST /api/services` - Create service (Admin/Manager)
- `PUT /api/services/:id` - Update service (Admin/Manager)
- `DELETE /api/services/:id` - Delete service (Admin)

### Customers
- `GET /api/customers` - Get customers with pagination
- `GET /api/customers/:id` - Get customer details
- `GET /api/customers/:id/stats` - Get customer statistics
- `POST /api/customers` - Register new customer
- `PUT /api/customers/:id` - Update customer (Admin/Manager)

### Visits
- `GET /api/visits` - Get visits with filters
- `GET /api/visits/:id` - Get visit details
- `POST /api/visits` - Create new visit

### Staff
- `GET /api/staff` - Get all staff
- `GET /api/staff/:id` - Get staff details
- `GET /api/staff/performance` - Get all staff performance
- `GET /api/staff/:id/performance` - Get staff performance
- `PUT /api/staff/:id` - Update staff (Admin)

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics (Admin/Manager)
- `GET /api/dashboard/analytics` - Revenue analytics (Admin/Manager)

## Database Schema

### Core Entities

- **User** - Staff members with roles (Admin, Manager, Staff)
- **Customer** - Salon customers with loyalty tracking
- **Service** - Salon services with pricing tiers
- **Visit** - Customer visits with services and staff
- **DiscountRule** - Automated discount configurations

### Key Features

1. **Automated Discount System:**
   - 20% off every 6th visit
   - 20% off during birthday month
   - 2000 RWF off shampoo + service combos
   - 1000 RWF off when bringing own products

2. **Loyalty Points:**
   - 1 point per 1000 RWF spent
   - Track total points earned

3. **Staff Performance:**
   - Revenue per staff member
   - Visits served
   - Customer count
   - Service categories

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
npm run seed         # Seed database with sample data
```

## Database Commands

```bash
# Reset database (careful!)
npx prisma migrate reset

# View database in browser
npm run prisma:studio

# Generate new migration
npx prisma migrate dev --name migration_name
```

## Production Deployment

1. **Set production environment variables**
2. **Build the application:**
   ```bash
   npm run build
   ```
3. **Run database migrations:**
   ```bash
   npm run prisma:deploy
   ```
4. **Start the server:**
   ```bash
   npm start
   ```

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication & validation
│   ├── routes/          # API route definitions
│   ├── utils/           # Database & utility functions
│   ├── prisma/          # Database seeding
│   └── index.ts         # Main server file
├── prisma/
│   └── schema.prisma    # Database schema
├── API_DOCUMENTATION.md # Complete API docs
└── README.md
```

## Contributing

1. Follow TypeScript best practices
2. Use Prisma for all database operations
3. Implement proper error handling
4. Add validation for all inputs
5. Maintain consistent API response formats

## License

Private - Nappyhood Salon Management System

---

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)