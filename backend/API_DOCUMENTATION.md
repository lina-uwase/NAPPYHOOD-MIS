# Nappyhood Salon Management System API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Default Login Credentials
- **Admin**: `admin@nappyhood.com` / `admin123`
- **Manager**: `manager@nappyhood.com` / `manager123`
- **Staff**: `stylist1@nappyhood.com` / `staff123`

---

## Authentication Endpoints

### POST /api/auth/login
Login to the system.

**Request Body:**
```json
{
  "email": "admin@nappyhood.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "Nappyhood Admin",
      "email": "admin@nappyhood.com",
      "role": "ADMIN"
    }
  }
}
```

### POST /api/auth/register
Register a new user (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "New Staff Member",
  "email": "staff@nappyhood.com",
  "password": "password123",
  "phone": "+250788000000",
  "role": "STAFF"
}
```

---

## Services Endpoints

### GET /api/services
Get all services.

**Query Parameters:**
- `category` (optional): Filter by service category
- `isActive` (optional): Filter by active status (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "service_id",
      "name": "Shampoo",
      "category": "HAIR_TREATMENTS",
      "description": "Service description",
      "singlePrice": 7000,
      "combinedPrice": null,
      "childPrice": 9000,
      "childCombinedPrice": null,
      "duration": 60,
      "isActive": true,
      "isComboEligible": true
    }
  ]
}
```

### GET /api/services/:id
Get service by ID.

### POST /api/services
Create a new service (Admin/Manager only).

**Request Body:**
```json
{
  "name": "New Service",
  "category": "HAIR_TREATMENTS",
  "description": "Service description",
  "singlePrice": 10000,
  "combinedPrice": 15000,
  "childPrice": 8000,
  "childCombinedPrice": 12000,
  "duration": 90,
  "isComboEligible": false
}
```

### PUT /api/services/:id
Update a service (Admin/Manager only).

### DELETE /api/services/:id
Soft delete a service (Admin only).

---

## Customers Endpoints

### GET /api/customers
Get all customers with pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` (optional): Search by name, phone, or email

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### GET /api/customers/:id
Get customer by ID with visit history.

### GET /api/customers/:id/stats
Get customer statistics and discount eligibility.

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {...},
    "stats": {
      "totalVisits": 5,
      "totalSpent": 45000,
      "loyaltyPoints": 45,
      "lastVisit": "2024-01-20T10:30:00Z",
      "averageSpending": 9000,
      "isBirthdayMonth": false,
      "isEligibleForSixthVisitDiscount": true,
      "monthlyVisits": {...}
    }
  }
}
```

### POST /api/customers
Register a new customer.

**Request Body:**
```json
{
  "fullName": "Marie Claire Uwimana",
  "gender": "FEMALE",
  "location": "Nyamirambo",
  "district": "Nyarugenge",
  "province": "Kigali City",
  "phone": "+250788444444",
  "email": "marie@example.com",
  "birthDay": 15,
  "birthMonth": 3,
  "birthYear": 1990
}
```

### PUT /api/customers/:id
Update customer information (Admin/Manager only).

---

## Visits Endpoints

### GET /api/visits
Get all visits with pagination.

**Query Parameters:**
- `page`, `limit` (pagination)
- `customerId` (optional): Filter by customer
- `staffId` (optional): Filter by staff member
- `startDate`, `endDate` (optional): Date range filter

### GET /api/visits/:id
Get visit details by ID.

### POST /api/visits
Create a new visit (automatic discount calculation).

**Request Body:**
```json
{
  "customerId": "customer_id",
  "services": [
    {
      "serviceId": "service_id",
      "quantity": 1,
      "isChild": false,
      "isCombined": true
    }
  ],
  "staffIds": ["staff_id_1", "staff_id_2"],
  "notes": "Optional visit notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "visit_id",
    "customerId": "customer_id",
    "visitDate": "2024-01-20T10:30:00Z",
    "totalAmount": 15000,
    "discountAmount": 3000,
    "finalAmount": 12000,
    "loyaltyPointsEarned": 12,
    "services": [...],
    "staff": [...],
    "discounts": [...]
  }
}
```

---

## Staff Endpoints

### GET /api/staff
Get all staff members.

**Query Parameters:**
- `isActive` (default: true)
- `role` (optional): Filter by role

### GET /api/staff/:id
Get staff member by ID.

### GET /api/staff/performance
Get performance overview for all staff.

**Query Parameters:**
- `period`: 'today', 'week', 'month' (default: 'month')
- `startDate`, `endDate` (optional): Custom date range

### GET /api/staff/:id/performance
Get detailed performance for specific staff member.

**Response:**
```json
{
  "success": true,
  "data": {
    "staff": {...},
    "period": "month",
    "metrics": {
      "totalVisits": 25,
      "totalRevenue": 450000,
      "averageRevenuePerVisit": 18000,
      "uniqueCustomers": 20,
      "serviceCategories": [...]
    },
    "visits": [...],
    "performanceChart": [...]
  }
}
```

### PUT /api/staff/:id
Update staff member (Admin only).

---

## Dashboard Endpoints

### GET /api/dashboard/stats
Get dashboard statistics (Admin/Manager only).

**Query Parameters:**
- `period`: 'today', 'week', 'month' (default: 'month')

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalCustomers": 150,
      "totalServices": 35,
      "activeStaff": 4,
      "periodVisits": 45,
      "allTimeVisits": 300,
      "totalRevenue": 850000,
      "averageVisitValue": 18889,
      "customerRetentionRate": 75.5
    },
    "topServices": [...],
    "revenueTrend": [...],
    "staffPerformance": [...],
    "upcomingBirthdays": [...],
    "sixthVisitEligible": [...]
  }
}
```

### GET /api/dashboard/analytics
Get revenue analytics (Admin/Manager only).

**Response:**
```json
{
  "success": true,
  "data": {
    "categoryRevenue": [...],
    "peakHours": [...],
    "period": "month"
  }
}
```

---

## Service Categories

- `HAIR_TREATMENTS`: Hair treatments and therapies
- `TWIST_HAIRSTYLE`: Various twist hairstyles
- `CORNROWS_BRAIDS`: Cornrow and braiding styles
- `STRAWSET_CURLS`: Strawset and curl patterns
- `STYLING_SERVICE`: General styling services
- `SPECIAL_OFFERS`: Special promotional services

## User Roles

- `ADMIN`: Full system access
- `MANAGER`: Customer and visit management, staff performance viewing
- `STAFF`: Basic customer and visit operations

## Discount Types

- `SIXTH_VISIT`: 20% off every 6th visit
- `BIRTHDAY_MONTH`: 20% off during birthday month (once per month)
- `SERVICE_COMBO`: 2000 RWF off when combining shampoo with other services
- `BRING_OWN_PRODUCT`: 1000 RWF off when bringing own products

## Error Responses

All endpoints return consistent error formats:

```json
{
  "error": "Error message",
  "field": "specific_field" // (optional, for validation errors)
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Database Setup Commands

1. Install dependencies: `npm install`
2. Generate Prisma client: `npm run prisma:generate`
3. Run migrations: `npm run prisma:migrate`
4. Seed database: `npm run seed`
5. Start development server: `npm run dev`

## Environment Variables Required

```
DATABASE_URL="postgresql://username:password@localhost:5432/NAPPYHOOD"
JWT_SECRET="your_jwt_secret_key"
PORT=5000
NODE_ENV=development
```