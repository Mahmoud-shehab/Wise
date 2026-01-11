# 🚀 Deploy to GitHub Pages - Step by Step

## Prerequisites
- Git installed on your computer
- GitHub account access
- Repository: https://github.com/Mahmoud-shehab/Wise.git

---

## Step 1: Initialize Git (if not already done)

Open your terminal in the project folder and run:

```bash
git init
git remote add origin https://github.com/Mahmoud-shehab/Wise.git
```

---

## Step 2: Add All Files

```bash
git add .
```

---

## Step 3: Commit Your Changes

```bash
git commit -m "Initial commit: Wise Task Manager with all features"
```

---

## Step 4: Push to GitHub

```bash
git branch -M main
git push -u origin main
```

If you get an error about existing content, use:

```bash
git push -u origin main --force
```

⚠️ **Warning:** `--force` will overwrite the remote repository. Only use if you're sure!

---

## Step 5: Set Up GitHub Secrets

1. Go to: https://github.com/Mahmoud-shehab/Wise/settings/secrets/actions
2. Click "New repository secret"
3. Add these two secrets:

### Secret 1: VITE_SUPABASE_URL
- Name: `VITE_SUPABASE_URL`
- Value: Your Supabase project URL (from `.env.local`)
- Example: `https://xxxxxxxxxxxxx.supabase.co`

### Secret 2: VITE_SUPABASE_PUBLISHABLE_KEY
- Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
- Value: Your Supabase anon/public key (from `.env.local`)
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Step 6: Enable GitHub Pages

1. Go to: https://github.com/Mahmoud-shehab/Wise/settings/pages
2. Under "Source", select: **GitHub Actions**
3. Click "Save"

---

## Step 7: Trigger Deployment

The deployment will start automatically when you push to `main` branch.

Or manually trigger it:
1. Go to: https://github.com/Mahmoud-shehab/Wise/actions
2. Click on "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Select branch: `main`
5. Click "Run workflow"

---

## Step 8: Wait for Deployment

1. Go to: https://github.com/Mahmoud-shehab/Wise/actions
2. Watch the workflow run (takes 2-5 minutes)
3. Wait for green checkmark ✅

---

## Step 9: Access Your Site

Your site will be available at:
```
https://mahmoud-shehab.github.io/Wise/
```

Or check the exact URL in:
- Settings → Pages → "Your site is live at..."

---

## Troubleshooting

### If push fails with "authentication failed":

**Option 1: Use Personal Access Token**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`
4. Copy the token
5. Use it as password when pushing:
```bash
git push -u origin main
# Username: Mahmoud-shehab
# Password: [paste your token]
```

**Option 2: Use SSH**
```bash
git remote set-url origin git@github.com:Mahmoud-shehab/Wise.git
git push -u origin main
```

### If deployment fails:

1. Check GitHub Actions logs
2. Verify secrets are set correctly
3. Make sure `base` in `vite.config.ts` is set to `/Wise/`

### If site shows blank page:

1. Check browser console for errors
2. Verify Supabase URL and key are correct
3. Check that base path is correct in vite.config.ts

---

## Quick Commands Summary

```bash
# 1. Add all files
git add .

# 2. Commit
git commit -m "Deploy Wise Task Manager"

# 3. Push to GitHub
git push -u origin main

# 4. Check deployment status
# Go to: https://github.com/Mahmoud-shehab/Wise/actions

# 5. Access your site
# https://mahmoud-shehab.github.io/Wise/
```

---

## After Deployment

### To update your site later:

```bash
# 1. Make your changes
# 2. Add and commit
git add .
git commit -m "Update: description of changes"

# 3. Push
git push

# 4. GitHub Actions will automatically deploy
```

---

## Important Notes

1. ✅ GitHub Actions workflow is already configured
2. ✅ Vite config has correct base path
3. ⚠️ You MUST add Supabase secrets to GitHub
4. ⚠️ Enable GitHub Pages in repository settings
5. 🔒 Never commit `.env.local` file (it's in .gitignore)

---

## Need Help?

If you encounter any issues:
1. Check GitHub Actions logs for errors
2. Verify all secrets are set
3. Make sure GitHub Pages is enabled
4. Check browser console for errors

---

**Ready to deploy! Follow the steps above and your app will be live! 🎉**
