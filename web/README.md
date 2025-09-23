# Nappyhood Salon Management System - Frontend

A modern, responsive salon management system built with Next.js for Nappyhood Salon.

## Features

- 🔐 **Authentication** - Email-based login system
- 💇‍♀️ **Service Management** - Complete CRUD for salon services
- 👥 **Customer Management** - Customer registration and visit tracking
- 📅 **Visit Recording** - Record customer visits with multiple services
- 💰 **Automated Discounts** - 6th visit, birthday month, service combos
- 🎯 **Loyalty System** - Points earning and tracking
- 📊 **Analytics** - Staff performance and salon metrics
- 🎨 **Nappyhood Branding** - Custom logo and green theme

## Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## Default Login Credentials

- **Admin**: `admin@nappyhood.com` / `admin123`
- **Manager**: `manager@nappyhood.com` / `manager123`
- **Staff**: `stylist1@nappyhood.com` / `staff123`

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios

## API Integration

The frontend connects to the Nappyhood Salon backend API running on `http://localhost:5000`. Make sure the backend server is running before starting the frontend.

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── contexts/           # React Context providers
├── services/           # API service layers
└── utils/              # Utility functions
```

## Environment Setup

The app is configured to work with the Nappyhood Salon backend. Update the API configuration in `src/config/api.ts` if needed.

---

Built with ❤️ for Nappyhood Salon - Your Natural Hair Care Home!
