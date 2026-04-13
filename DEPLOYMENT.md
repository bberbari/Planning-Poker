# Deployment Guide

This guide explains how to deploy the Banyan Technology Estimation app to a production environment so others can access it remotely.

## Overview

Your application consists of:
- **Backend**: Node.js/Express server with Socket.io (port 3001)
- **Frontend**: React/Vite application (port 3000)

## Hosting Options

### Option 1: Railway (Recommended for beginners)
- Easy setup, good free tier
- Automatically handles environment variables
- Supports both Node.js and static sites

### Option 2: Render
- Free tier available
- Easy deployment from GitHub
- Supports Node.js and static sites

### Option 3: Heroku
- Well-established platform
- Free tier limited (may require credit card)
- Good documentation

### Option 4: DigitalOcean App Platform
- Simple deployment
- Pay-as-you-go pricing

### Option 5: Vercel (Frontend) + Railway/Render (Backend)
- Vercel is excellent for frontend
- Use separate service for backend

## Step-by-Step Deployment

### Prerequisites
1. Create accounts on your chosen hosting platform(s)
2. Have your code in a Git repository (GitHub, GitLab, etc.)

---

## Deployment Strategy: Separate Frontend & Backend

### Backend Deployment

#### 1. Prepare Backend for Production

Create a `.env` file in the `backend` folder (or set environment variables in your hosting platform):

```env
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

#### 2. Update Backend CORS Settings

The backend already uses `process.env.FRONTEND_URL`, so you just need to set this environment variable.

#### 3. Deploy Backend

**For Railway:**
1. Go to Railway.app and create a new project
2. Connect your GitHub repository
3. Select the `backend` folder as the root
4. Set environment variables:
   - `PORT=3001`
   - `FRONTEND_URL=https://your-frontend-url.com`
5. Railway will auto-detect Node.js and deploy

**For Render:**
1. Go to Render.com dashboard
2. Click "New" → "Web Service"
3. Connect your repository
4. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variables:
   - `PORT=3001`
   - `FRONTEND_URL=https://your-frontend-url.com`

---

### Frontend Deployment

#### 1. Update Frontend Configuration

Create a `.env.production` file in the `frontend` folder:

```env
VITE_SOCKET_URL=https://your-backend-url.com
```

Or set this as an environment variable in your hosting platform.

#### 2. Update `frontend/src/services/socketService.ts`

The code already uses `import.meta.env.VITE_SOCKET_URL`, so it will automatically use your production URL.

#### 3. Build Frontend

```bash
cd frontend
npm run build
```

This creates a `dist` folder with production-ready files.

#### 4. Deploy Frontend

**For Vercel (Recommended for Frontend):**
1. Install Vercel CLI: `npm i -g vercel`
2. In the `frontend` folder, run: `vercel`
3. Follow prompts to deploy
4. Set environment variable: `VITE_SOCKET_URL=https://your-backend-url.com`
5. Redeploy after setting environment variable

**For Netlify:**
1. Go to Netlify.com
2. Connect your repository
3. Set:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Add environment variable: `VITE_SOCKET_URL=https://your-backend-url.com`

**For Render (Static Site):**
1. Go to Render.com
2. Click "New" → "Static Site"
3. Connect repository
4. Set:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Add environment variable: `VITE_SOCKET_URL=https://your-backend-url.com`

---

## Alternative: Single Platform Deployment

If you want everything on one platform:

### Railway (Full Stack)
1. Deploy backend as a web service
2. Deploy frontend as a static site
3. Set environment variables for both

### Render (Full Stack)
1. Deploy backend as a web service
2. Deploy frontend as a static site
3. Set environment variables for both

---

## Important Configuration Steps

### 1. Update CORS in Backend

Make sure your backend's `server.js` allows your frontend domain:

```javascript
// Already configured to use process.env.FRONTEND_URL
origin: process.env.FRONTEND_URL || "http://localhost:3000"
```

Set `FRONTEND_URL` to your production frontend URL.

### 2. Update Socket Connection in Frontend

The frontend uses `VITE_SOCKET_URL` environment variable. Set this to your backend URL.

### 3. Update API Calls

Check `frontend/src/components/Game.tsx` for any hardcoded `localhost:3001` references and update them to use environment variables.

---

## Post-Deployment Checklist

- [ ] Backend is accessible at your backend URL
- [ ] Frontend is accessible at your frontend URL
- [ ] Environment variables are set correctly
- [ ] CORS is configured to allow your frontend domain
- [ ] Socket.io connection works (check browser console)
- [ ] Test creating a session
- [ ] Test joining a session
- [ ] Test voting functionality
- [ ] Test admin features

---

## Troubleshooting

### Socket.io Connection Issues
- Check that `VITE_SOCKET_URL` is set correctly
- Verify CORS settings allow your frontend domain
- Check browser console for errors
- Ensure backend is running and accessible

### CORS Errors
- Verify `FRONTEND_URL` environment variable matches your frontend domain exactly
- Include protocol (https://) in the URL
- No trailing slash

### Build Issues
- Make sure all dependencies are in `package.json`
- Run `npm install` before building
- Check for TypeScript errors: `npm run build` in frontend

---

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to Git
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Consider adding rate limiting to your backend
4. **Input Validation**: Already implemented, but review for production
5. **Session Management**: Consider adding session expiration

---

## Quick Start Commands

### Local Testing Before Deployment

```bash
# Terminal 1 - Backend
cd backend
npm install
FRONTEND_URL=http://localhost:3000 npm start

# Terminal 2 - Frontend
cd frontend
npm install
VITE_SOCKET_URL=http://localhost:3001 npm run dev
```

### Production Build

```bash
# Backend (no build needed, just deploy)
cd backend
npm install

# Frontend
cd frontend
npm install
VITE_SOCKET_URL=https://your-backend-url.com npm run build
```

---

## Example Environment Variables

### Backend (.env)
```
PORT=3001
FRONTEND_URL=https://banyan-estimation.vercel.app
NODE_ENV=production
```

### Frontend (.env.production)
```
VITE_SOCKET_URL=https://banyan-estimation-backend.railway.app
VITE_API_URL=https://banyan-estimation-backend.railway.app
```

**Note**: Both `VITE_SOCKET_URL` and `VITE_API_URL` should point to your backend URL. The Socket.io connection uses `VITE_SOCKET_URL`, while REST API calls use `VITE_API_URL`.

---

## Need Help?

- Check hosting platform documentation
- Review error logs in hosting platform dashboard
- Check browser console for frontend errors
- Check backend logs for server errors
