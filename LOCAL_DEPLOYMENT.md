# 🚀 Local Deployment Guide

**Date**: March 9, 2026  
**Status**: ✅ Production Builds Ready

---

## Overview

This guide explains how to run the Healthcare Price Transparency Platform in **production mode locally**. Both the backend (Express.js) and frontend (Next.js) have been compiled and optimized for production.

---

## Prerequisites

- ✅ Node.js 20.x or higher
- ✅ npm 10.x or higher
- ✅ All dependencies installed (`npm install` completed)
- ✅ Production builds created (`npm run build` completed)

---

## Production Builds Status

### Backend Build ✅
**Command**: `npm run build` in `backend/` directory  
**Output**: Compiled TypeScript → JavaScript in `backend/dist/`  
**Status**: **READY**

```
backend/
├── dist/
│   ├── server.js          # Compiled entry point
│   ├── app.js             # Express app
│   ├── db/
│   ├── middleware/
│   ├── services/
│   ├── types/
│   └── utils/
└── package.json
```

### Frontend Build ✅
**Command**: `npm run build` in `frontend/` directory  
**Output**: Optimized Next.js in `frontend/.next/`  
**Status**: **READY**

```
frontend/
├── .next/                 # Production build
│   ├── server/
│   ├── static/           # Pre-optimized JS/CSS
│   └── standalone/
├── public/
└── package.json
```

---

## Method 1: Automated Deployment Script 🤖

### Run the deployment script:

```powershell
cd c:\Users\icefr\MHIProject
.\deploy-local.ps1
```

**What it does:**
- ✓ Verifies production builds exist
- ✓ Starts backend on port 3001
- ✓ Starts frontend on port 3000
- ✓ Shows live server status
- ✓ Keeps services running

**Output:**
```
✅ Local Deployment Complete!

📊 Server Status:
  ✓ Backend:  Listening on port 3001
  ✓ Frontend: Listening on port 3000

🌐 Access the application:
   Frontend: http://localhost:3000
   API:      http://localhost:3001/api/health
```

---

## Method 2: Manual Deployment 🛠

### Step 1: Start Backend

```powershell
cd c:\Users\icefr\MHIProject\backend
npm start
```

**Expected Output:**
```
🚀 Server running on http://localhost:3001
```

### Step 2: Start Frontend (in separate terminal)

```powershell
cd c:\Users\icefr\MHIProject\frontend
npm start
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## Testing the Deployment

### 1. Backend Health Check
```
GET http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "uptime": 2.345,
  "timestamp": "2026-03-09T..."
}
```

### 2. Frontend Access
Open browser: `http://localhost:3000`

**Expected**: Hero page loads with search form

### 3. API Test
```
GET http://localhost:3001/api/v1/search?procedure_name=office%20visit&limit=5
```

**Expected**: Returns search results with procedures

---

## Server Details

### Backend Server (Express.js)

**Port**: 3001  
**Protocol**: HTTP  
**Environment**: Production  
**Node Process**: `node dist/server.js`

**Available Endpoints:**
- `GET /api/health` - Health check
- `GET /api/v1/search` - Search procedures
- `GET /api/v1/benchmark` - Pricing benchmarks
- `POST /api/v1/estimate` - Cost estimation
- `POST /api/v1/upload` - File upload

### Frontend Server (Next.js)

**Port**: 3000  
**Framework**: Next.js 14 (production mode)  
**Protocol**: HTTP  
**Built-in**: Static asset optimization

**Available Routes:**
- `/` - Home/hero page
- `/search` - Search results
- `/benchmark` - Benchmarking dashboard
- `/estimate` - Cost estimator
- `/dashboard` - User dashboard
- `/admin` - Admin panel

---

## Performance Optimizations

### Backend Optimizations ✓
- TypeScript compiled to optimized JavaScript
- Source maps included for debugging
- Production dependencies only

### Frontend Optimizations ✓
- Code splitting and tree-shaking
- Automatic image optimization
- Static page generation (SSG)
- CSS minification
- JavaScript minification

**Frontend Build Output:**
```
Route                        Size      First Load JS
┌ ○ /                       1.81 kB   89.3 kB
├ ○ /admin                  2.78 kB   149 kB
├ ○ /benchmark              103 kB    191 kB
├ ○ /dashboard              1.64 kB   148 kB
├ ○ /estimate               2.43 kB   90 kB
└ ○ /search                 2.49 kB   90 kB
```

---

## Environment Configuration

### Backend (.env.local)
Required variables:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
SUPABASE_JWT_SECRET=your-jwt-secret

NODE_ENV=production
PORT=3001
LOG_LEVEL=info
```

### Frontend (.env.local)
Required variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Troubleshooting

### Port Already in Use

```powershell
# Find process using port 3000 or 3001
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# Kill the process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force
```

### Backend Build Missing

```powershell
cd backend
npm run build
```

### Frontend Build Missing

```powershell
cd frontend
npm run build
```

### Supabase Credentials Error

Make sure `.env.local` files are configured with valid Supabase credentials:
- Get from: https://supabase.com → Your Project → Settings → API

---

## Monitoring

### Check Server Status

```powershell
# View network connections
Get-NetTCPConnection -LocalPort 3000, 3001 | Select-Object LocalPort, State

# View running Node processes
Get-Process node
```

### View Logs

**Backend Logs:**
- Piped to console (Pino structured logging)
- Check for errors related to database connection

**Frontend Logs:**
- Piped to console (Next.js built-in logger)
- Check for API connection errors

---

## Stopping the Servers

### Using Script
- Press `Ctrl+C` in the terminal running the script
- Both servers will gracefully shut down

### Manual Stop
- Terminal 1 (Backend): Press `Ctrl+C`
- Terminal 2 (Frontend): Press `Ctrl+C`

---

## Deployment Checklist

- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed
- ✅ Backend compiled (`npm run build`)
- ✅ Frontend compiled (`npm run build`)
- ✅ Environment variables configured
- ✅ Ports 3000 & 3001 available
- ✅ Supabase credentials valid
- ✅ Ready for local testing

---

## Next Steps (Phases 4-5)

### Phase 4: Advanced Features
- Data import validation
- CSV/JSON/XLSX parsing
- Export functionality
- HIPAA audit reports
- API rate limiting
- Query caching

### Phase 5: Production Deployment
- Deploy frontend to Vercel
- Deploy backend to Render
- Configure production Supabase
- Set up CI/CD pipeline
- Enable monitoring & alerting

---

## Support

For issues or questions:
1. Check `.env.local` configuration
2. Verify all dependencies installed (`npm list`)
3. Ensure ports 3000 & 3001 are available
4. Check Supabase connectivity
5. Review logs for error messages

---

**Status**: ✅ Local Deployment Ready  
**Last Updated**: March 9, 2026  
**Version**: 1.0
