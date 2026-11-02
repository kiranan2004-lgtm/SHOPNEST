# SHOPNEST - Frontend Client

The web client for the SHOPNEST e-commerce application, built with React 19 and Vite.

## Features
- Single Page Application (SPA) architecture with React Router DOM v7
- Authentication state management with AuthContext & Token-based authorization
- Live shopping cart state synchronized with backend database via CartContext
- Responsive UI styled with modern nested CSS
- Cash on Delivery (COD) checkout workflow and customer order management

## Local Development

```powershell
# 1. Install dependencies
npm install

# 2. Run local development server (defaults to http://localhost:5173)
npm run dev

# 3. Build for production (output to dist/)
npm run build
```

## Production Deployment (Netlify)
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist`
- **Environment variables**:
  - `VITE_API_URL`: `https://your-backend-app.onrender.com/api`
