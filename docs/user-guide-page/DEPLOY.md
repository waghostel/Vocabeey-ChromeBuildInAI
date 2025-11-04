# Quick Deployment Guide

## 🚀 Deploy to Vercel in 3 Steps

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Navigate to the directory

```bash
cd docs/user-guide-page
```

### Step 3: Deploy

```bash
vercel login
vercel --prod
```

That's it! Your site will be live at a Vercel URL.

---

## 📝 What's Included

✅ `vercel.json` - Vercel configuration  
✅ `index.html` - Main page  
✅ `assets/` - CSS, JS, and images  
✅ All paths are relative and ready for deployment

## 🔗 After Deployment

Your site will be available at:

- `https://your-project-name.vercel.app`

You can customize the domain in Vercel Dashboard → Settings → Domains

## 🔄 Auto-Deploy from GitHub

1. Push this code to GitHub
2. Import the repo in Vercel Dashboard
3. Set Root Directory: `docs/user-guide-page`
4. Deploy!

Every push to main branch will auto-deploy.

## 🧪 Test Locally First

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server
```

Open `http://localhost:8000` in your browser.
