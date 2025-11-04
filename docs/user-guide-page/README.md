# Vocabeey User Guide Page

This is the user guide landing page for Vocabeey Chrome Extension.

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm install -g vercel
   ```

2. **Navigate to this directory**:

   ```bash
   cd docs/user-guide-page
   ```

3. **Login to Vercel**:

   ```bash
   vercel login
   ```

4. **Deploy**:

   ```bash
   vercel
   ```

   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time) or **Y** (subsequent deploys)
   - What's your project's name? **vocabeey-user-guide** (or your preferred name)
   - In which directory is your code located? **./** (current directory)

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `waghostel/Vocabeey-ChromeBuildInAI`
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `docs/user-guide-page`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
5. Click "Deploy"

### Option 3: Deploy via GitHub Integration

1. Push your changes to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Select your repository: `waghostel/Vocabeey-ChromeBuildInAI`
5. Set **Root Directory** to: `docs/user-guide-page`
6. Click "Deploy"

Vercel will automatically deploy on every push to your main branch.

## Local Development

To test locally, you can use any static file server:

### Using Python:

```bash
cd docs/user-guide-page
python -m http.server 8000
```

### Using Node.js (http-server):

```bash
npm install -g http-server
cd docs/user-guide-page
http-server
```

### Using VS Code Live Server:

1. Install "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

Then open your browser to `http://localhost:8000` (or the port shown).

## File Structure

```
docs/user-guide-page/
├── index.html              # Main HTML file
├── assets/
│   ├── css/
│   │   └── user-guide.css  # Styles
│   ├── js/
│   │   └── user-guide.js   # JavaScript
│   └── images/
│       └── Vocabee.png     # Logo
├── vercel.json             # Vercel configuration
└── README.md               # This file
```

## Custom Domain (Optional)

After deployment, you can add a custom domain:

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Environment

- No build step required
- Pure static HTML/CSS/JavaScript
- No server-side rendering
- No environment variables needed
