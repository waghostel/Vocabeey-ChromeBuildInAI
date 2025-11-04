# Vercel Deployment Guide for Vocabeey User Guide Page

This guide will walk you through deploying and updating the Vocabeey user guide webpage to Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Deployment](#initial-deployment)
- [Updating the Webpage](#updating-the-webpage)
- [Troubleshooting](#troubleshooting)
- [Custom Domain Setup](#custom-domain-setup)

---

## Prerequisites

Before you begin, make sure you have:

1. **A Vercel Account**
   - Sign up at [vercel.com](https://vercel.com) (free tier is sufficient)
   - You can sign up with GitHub, GitLab, or Bitbucket

2. **Git Installed**
   - Check by running: `git --version`
   - Download from [git-scm.com](https://git-scm.com/) if needed

3. **Node.js Installed** (for Vercel CLI)
   - Check by running: `node --version`
   - Download from [nodejs.org](https://nodejs.org/) if needed

---

## Initial Deployment

### Method 1: Deploy via Vercel Dashboard (Easiest for Beginners)

#### Step 1: Push Your Code to GitHub

1. Make sure your changes are committed:
   ```bash
   git add .
   git commit -m "Prepare user guide page for deployment"
   git push origin main
   ```

#### Step 2: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Find and select your repository: `waghostel/Vocabeey-ChromeBuildInAI`
5. Click **"Import"**

#### Step 3: Configure Project Settings

In the project configuration screen:

1. **Project Name**: Enter a name (e.g., `vocabeey-user-guide`)
2. **Framework Preset**: Select **"Other"**
3. **Root Directory**: Click **"Edit"** and enter: `docs/user-guide-page`
4. **Build Command**: Leave empty (no build needed)
5. **Output Directory**: Leave empty
6. **Install Command**: Leave empty

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete (usually 30-60 seconds)
3. You'll see a success screen with your live URL!

Your site will be live at: `https://your-project-name.vercel.app`

---

### Method 2: Deploy via Vercel CLI (For Advanced Users)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

#### Step 3: Navigate to the Project Directory

```bash
cd docs/user-guide-page
```

#### Step 4: Deploy

For the first deployment:

```bash
vercel
```

Answer the prompts:

- **Set up and deploy?** → `Y`
- **Which scope?** → Select your account
- **Link to existing project?** → `N` (first time)
- **What's your project's name?** → `vocabeey-user-guide`
- **In which directory is your code located?** → `./`

For production deployment:

```bash
vercel --prod
```

---

## Updating the Webpage

Once your site is deployed, updating it is simple!

### Method 1: Automatic Updates via GitHub (Recommended)

If you deployed via Vercel Dashboard, updates are automatic:

1. **Make your changes** to the files in `docs/user-guide-page/`
   - Edit `index.html` for content changes
   - Edit `assets/css/user-guide.css` for styling
   - Edit `assets/js/user-guide.js` for functionality

2. **Commit and push to GitHub**:

   ```bash
   git add .
   git commit -m "Update user guide page"
   git push origin main
   ```

3. **Vercel automatically deploys** your changes!
   - Check the Vercel Dashboard to see deployment progress
   - Your site updates in 30-60 seconds

### Method 2: Manual Updates via Vercel CLI

1. **Make your changes** to the files

2. **Navigate to the directory**:

   ```bash
   cd docs/user-guide-page
   ```

3. **Deploy the update**:

   ```bash
   vercel --prod
   ```

4. Your site is updated!

---

## Common Update Scenarios

### Updating Content

**To update text, features, or sections:**

1. Open `docs/user-guide-page/index.html`
2. Find the section you want to update
3. Make your changes
4. Save the file
5. Commit and push (or deploy via CLI)

**Example: Adding a new feature card**

```html
<div class="feature-card">
  <div class="feature-card-header">
    <span class="feature-icon">🆕</span>
    <h3>New Feature Name</h3>
  </div>
  <p>Description of the new feature.</p>
  <ul class="feature-list">
    <li>Feature point 1</li>
    <li>Feature point 2</li>
  </ul>
</div>
```

### Updating Styles

**To change colors, fonts, or layout:**

1. Open `docs/user-guide-page/assets/css/user-guide.css`
2. Find the CSS rule you want to modify
3. Make your changes
4. Save and deploy

**Example: Changing primary color**

```css
:root {
  --primary-color: #6366f1; /* Change this hex code */
}
```

### Updating JavaScript Functionality

**To modify interactive features:**

1. Open `docs/user-guide-page/assets/js/user-guide.js`
2. Find the function you want to modify
3. Make your changes
4. Save and deploy

### Adding Images

1. Add your image to `docs/user-guide-page/assets/images/`
2. Reference it in HTML:
   ```html
   <img src="assets/images/your-image.png" alt="Description" />
   ```
3. Commit and deploy

---

## Verifying Your Updates

### Before Deploying

**Test locally first:**

1. Open `docs/user-guide-page/index.html` in your browser
2. Or use a local server:
   ```bash
   cd docs/user-guide-page
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser

### After Deploying

1. Go to your Vercel Dashboard
2. Click on your project
3. Check the **"Deployments"** tab
4. Click on the latest deployment
5. Click **"Visit"** to see your live site
6. Verify your changes are visible

---

## Troubleshooting

### Issue: Changes Not Showing Up

**Solution 1: Clear Browser Cache**

- Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- Or open in incognito/private mode

**Solution 2: Check Deployment Status**

- Go to Vercel Dashboard → Your Project → Deployments
- Make sure the latest deployment shows "Ready"
- If it shows "Error", click on it to see error details

**Solution 3: Verify Git Push**

```bash
git status
git log --oneline -5
```

Make sure your latest commit is pushed to GitHub.

### Issue: Deployment Failed

**Check the build logs:**

1. Go to Vercel Dashboard
2. Click on the failed deployment
3. Read the error message
4. Common issues:
   - Wrong root directory (should be `docs/user-guide-page`)
   - Missing files
   - Syntax errors in HTML/CSS/JS

**Fix and redeploy:**

1. Fix the issue locally
2. Test locally first
3. Commit and push again

### Issue: Images Not Loading

**Check image paths:**

- Paths should be relative: `assets/images/image.png`
- NOT absolute: `/assets/images/image.png`
- NOT with `../../`: `../../icons/image.png`

**Verify image exists:**

```bash
ls docs/user-guide-page/assets/images/
```

### Issue: 404 Page Not Found

**Check root directory setting:**

1. Go to Vercel Dashboard → Your Project → Settings
2. Click **"General"**
3. Verify **"Root Directory"** is set to: `docs/user-guide-page`
4. If not, update it and redeploy

---

## Custom Domain Setup

Want to use your own domain? (e.g., `guide.vocabeey.com`)

### Step 1: Add Domain in Vercel

1. Go to Vercel Dashboard → Your Project
2. Click **"Settings"** → **"Domains"**
3. Click **"Add"**
4. Enter your domain name
5. Click **"Add"**

### Step 2: Configure DNS

Vercel will show you DNS records to add. You have two options:

**Option A: Using a subdomain (e.g., guide.vocabeey.com)**

- Add a CNAME record:
  - Name: `guide`
  - Value: `cname.vercel-dns.com`

**Option B: Using root domain (e.g., vocabeey.com)**

- Add A records:
  - Name: `@`
  - Value: `76.76.21.21`

### Step 3: Wait for DNS Propagation

- DNS changes can take 24-48 hours
- Check status in Vercel Dashboard
- When ready, it will show "Valid Configuration"

---

## Best Practices

### 1. Always Test Locally First

```bash
cd docs/user-guide-page
python -m http.server 8000
```

### 2. Use Meaningful Commit Messages

```bash
git commit -m "Add new feature: Multi-language support card"
git commit -m "Fix: Update GitHub links to correct repository"
git commit -m "Style: Improve mobile responsiveness"
```

### 3. Check Deployment Preview

- Vercel creates a preview URL for every commit
- Test the preview before merging to main

### 4. Keep Backups

- Git automatically keeps history
- View previous versions: `git log`
- Revert if needed: `git revert <commit-hash>`

### 5. Monitor Performance

- Check Vercel Analytics (if enabled)
- Use Lighthouse in Chrome DevTools
- Optimize images if page is slow

---

## Quick Reference Commands

### Git Commands

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main

# View commit history
git log --oneline -10
```

### Vercel CLI Commands

```bash
# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# View project info
vercel inspect
```

### Local Testing

```bash
# Python server
python -m http.server 8000

# Node.js server
npx http-server

# Open in browser
start http://localhost:8000  # Windows
open http://localhost:8000   # Mac
```

---

## Getting Help

### Vercel Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Deployment Guide](https://vercel.com/docs/deployments/overview)
- [Custom Domains](https://vercel.com/docs/custom-domains)

### Project Support

- GitHub Issues: [waghostel/Vocabeey-ChromeBuildInAI/issues](https://github.com/waghostel/Vocabeey-ChromeBuildInAI/issues)
- Vercel Support: [vercel.com/support](https://vercel.com/support)

---

## Summary Checklist

### Initial Deployment

- [ ] Create Vercel account
- [ ] Push code to GitHub
- [ ] Import project to Vercel
- [ ] Set root directory to `docs/user-guide-page`
- [ ] Deploy and verify

### Updating Content

- [ ] Make changes to files
- [ ] Test locally
- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Verify deployment in Vercel Dashboard
- [ ] Check live site

### Troubleshooting

- [ ] Clear browser cache
- [ ] Check deployment logs
- [ ] Verify file paths
- [ ] Test locally first

---

**Congratulations!** You now know how to deploy and update the Vocabeey user guide page on Vercel! 🎉

For questions or issues, please open an issue on GitHub or contact the development team.
