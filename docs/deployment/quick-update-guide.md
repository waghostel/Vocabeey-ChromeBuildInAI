# Quick Update Guide - Vocabeey User Guide Page

## 🚀 How to Update the Webpage (3 Steps)

### Step 1: Make Your Changes

Edit files in `docs/user-guide-page/`:

- `index.html` - Content
- `assets/css/user-guide.css` - Styles
- `assets/js/user-guide.js` - JavaScript

### Step 2: Test Locally (Optional but Recommended)

```bash
cd docs/user-guide-page
python -m http.server 8000
```

Open `http://localhost:8000` in your browser

### Step 3: Deploy

```bash
git add .
git commit -m "Update user guide page"
git push origin main
```

**That's it!** Vercel automatically deploys your changes in ~60 seconds.

---

## 📝 Common Updates

### Update Text Content

1. Open `docs/user-guide-page/index.html`
2. Find the section (use Ctrl+F to search)
3. Edit the text
4. Save, commit, and push

### Change Colors

1. Open `docs/user-guide-page/assets/css/user-guide.css`
2. Find `:root` section at the top
3. Change color values (e.g., `--primary-color: #6366f1;`)
4. Save, commit, and push

### Add a New Feature Card

Add this to the features section in `index.html`:

```html
<div class="feature-card">
  <div class="feature-card-header">
    <span class="feature-icon">🆕</span>
    <h3>Feature Name</h3>
  </div>
  <p>Description here.</p>
  <ul class="feature-list">
    <li>Point 1</li>
    <li>Point 2</li>
  </ul>
</div>
```

### Add an Image

1. Copy image to `docs/user-guide-page/assets/images/`
2. Use in HTML: `<img src="assets/images/your-image.png" alt="Description">`
3. Commit and push

---

## 🔍 Verify Your Update

1. Go to [vercel.com](https://vercel.com)
2. Click on your project
3. Check "Deployments" tab
4. Wait for "Ready" status
5. Click "Visit" to see live site

---

## ⚠️ Troubleshooting

**Changes not showing?**

- Clear browser cache: `Ctrl + Shift + R`
- Check Vercel deployment status
- Verify git push: `git log --oneline -5`

**Deployment failed?**

- Check Vercel Dashboard for error logs
- Test locally first
- Verify file paths are relative

---

## 📞 Need Help?

See full guide: `docs/deployment/vercel-deployment-guide.md`

Or open an issue: [GitHub Issues](https://github.com/waghostel/Vocabeey-ChromeBuildInAI/issues)
