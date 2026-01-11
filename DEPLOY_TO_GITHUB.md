# 🚀 Deploy to GitHub Pages - Step by Step

## ✅ COMPLETED: Code Successfully Pushed to GitHub!

Your code is now live at: https://github.com/Mahmoud-shehab/Wise

---

## NEXT STEPS TO COMPLETE DEPLOYMENT:

---

## Step 1: Set Up GitHub Secrets ⚠️ REQUIRED

1. Go to: https://github.com/Mahmoud-shehab/Wise/settings/secrets/actions
2. Click "New repository secret"
3. Add these two secrets:

### Secret 1: VITE_SUPABASE_URL
- Name: `VITE_SUPABASE_URL`
- Value: `https://jgeytyzcnumecxmefhwq.supabase.co`

### Secret 2: VITE_SUPABASE_PUBLISHABLE_KEY
- Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnZXl0eXpjbnVtZWN4bWVmaHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNTg4NjEsImV4cCI6MjA4MjgzNDg2MX0.R78X2WZKXxRIY7MtPjKaCesgdRGxrun_IZroFzctP6c`

---

## Step 2: Enable GitHub Pages

1. Go to: https://github.com/Mahmoud-shehab/Wise/settings/pages
2. Under "Source", select: **GitHub Actions**
3. Click "Save"

---

## Step 3: Trigger Deployment

The deployment should start automatically since you just pushed to `main` branch.

Check deployment status:
1. Go to: https://github.com/Mahmoud-shehab/Wise/actions
2. Look for "Deploy to GitHub Pages" workflow
3. Wait for green checkmark ✅ (takes 2-5 minutes)

Or manually trigger it:
1. Go to: https://github.com/Mahmoud-shehab/Wise/actions
2. Click on "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Select branch: `main`
5. Click "Run workflow"

---

## Step 4: Access Your Site

After deployment completes, your site will be available at:
```
https://mahmoud-shehab.github.io/Wise/
```

Or check the exact URL in:
- Settings → Pages → "Your site is live at..."

---

## Troubleshooting

### If deployment fails:

1. Check GitHub Actions logs at: https://github.com/Mahmoud-shehab/Wise/actions
2. Verify secrets are set correctly in repository settings
3. Make sure both secrets are added exactly as shown above

### If site shows blank page:

1. Check browser console for errors (F12)
2. Verify Supabase URL and key are correct in GitHub secrets
3. Check that base path is correct in vite.config.ts (should be `/Wise/`)

---

## IMPORTANT: Database Migration Reminder

Don't forget to apply this SQL in your Supabase SQL Editor for message notifications to work properly:

File: `update_messages_notifications_trigger.sql`

This will make notifications automatically disappear when you read a message.

---

## Quick Summary

✅ Code pushed to GitHub: https://github.com/Mahmoud-shehab/Wise
⏳ Next: Add GitHub Secrets (Step 1 above)
⏳ Next: Enable GitHub Pages (Step 2 above)
⏳ Next: Wait for deployment (Step 3 above)
🎯 Final: Access your site at https://mahmoud-shehab.github.io/Wise/

---

## After Deployment

### To update your site later:

```bash
# 1. Make your changes in the code
# 2. Add and commit
git add .
git commit -m "Update: description of changes"

# 3. Push
git push

# 4. GitHub Actions will automatically deploy
```

---

**Your Wise Task Manager is ready to go live! 🎉**

Follow the 4 simple steps above and you'll be online in minutes!
