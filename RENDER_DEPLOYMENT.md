# Fixing "Page Not Found" on Refresh - Render Deployment

## The Problem
When you refresh a page on your deployed React SPA (Single Page Application), you get a "Page Not Found" error. This happens because:

1. React Router handles routing on the **client side**
2. When you refresh, the browser requests the URL from the **server**
3. The server doesn't have a route for `/admin`, `/recruiter`, etc.
4. Server returns 404

## The Solution
Configure the server to **always return `index.html`** for all routes, letting React Router handle the routing.

---

## For Render.com (Static Site)

### Option 1: Using `_redirects` file (Recommended)
✅ **Already Created**: `frontend/public/_redirects`
```
/*    /index.html   200
```

This tells Render to serve `index.html` for all routes with a 200 status code.

### Option 2: Configure in Render Dashboard
1. Go to your Render service settings
2. Under "Build & Deploy" → "Redirect/Rewrite Rules"
3. Add:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Status**: `200 (Rewrite)`

---

## For Render.com (Web Service with Node.js)

If you're serving the frontend through a Node.js server, add this to your server:

```javascript
// Serve static files
app.use(express.static('frontend/dist'));

// Handle SPA routing - Always return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});
```

---

## For Other Platforms (Bonus)

### Vercel
✅ **Already Created**: `frontend/public/vercel.json`

### Netlify  
✅ **Already Created**: `frontend/public/netlify.toml`

### AWS S3 + CloudFront
Configure CloudFront error responses:
- Error Code: 403
- Response Page Path: `/index.html`
- HTTP Response Code: 200

### Nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Deployment Checklist

1. ✅ `_redirects` file created in `frontend/public/`
2. ✅ Vite config optimized for production build
3. ✅ Build command: `npm run build`
4. ✅ Publish directory: `dist` (or `build`)

## Testing After Deployment

1. Deploy your changes to Render
2. Visit your site: `https://your-app.onrender.com`
3. Navigate to a route like `/admin` or `/recruiter`
4. **Refresh the page** (F5 or Cmd+R)
5. ✅ Should load correctly, not show 404

## Important Notes

- The `_redirects` file must be in the `public/` folder so Vite copies it to `dist/` during build
- Make sure your build process includes the `_redirects` file in the output
- If still not working, check Render's build logs to ensure `_redirects` is included

---

## Common Issues & Fixes

### Issue: Still getting 404
**Solution**: 
- Check if `_redirects` file is in the `dist` folder after build
- Run `npm run build` locally and verify `dist/_redirects` exists

### Issue: Routes work locally but not on Render
**Solution**:
- Local dev server (Vite) handles SPA routing automatically
- Production needs explicit configuration (the `_redirects` file)

### Issue: API calls return 404
**Solution**:
- Ensure your `VITE_API_URL` environment variable is set in Render
- API routes should NOT be affected by the `_redirects` rule (they go to backend)

---

## Environment Variables on Render

Make sure these are set in Render:

**Frontend Service:**
- `VITE_API_URL` = `https://your-backend-api.onrender.com`

**Backend Service:**
- `FRONTEND_URL` = `https://your-frontend.onrender.com`
- `DATABASE_URL` = (your database connection string)
- `JWT_SECRET_KEY` = (your JWT secret)
- All other environment variables from `.env`

