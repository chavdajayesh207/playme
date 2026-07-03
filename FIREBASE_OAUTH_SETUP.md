# 🔐 Firebase Configuration - Fixing OAuth Domain Authorization

## Problem
You're seeing: **"localhost" is not whitelisted in the Firebase console**

This means Google, GitHub, and Apple OAuth sign-in won't work until you whitelist "localhost" in Firebase Console.

---

## ✅ Solution: Add "localhost" to Authorized Domains

### Step 1: Open Firebase Console
Go to: https://console.firebase.google.com/

### Step 2: Select Your Project
Click on project: **"nodal-plating-zjlsj"**

### Step 3: Navigate to Authentication Settings
1. Go to **Authentication** (left menu)
2. Click on **Settings** tab
3. Scroll down to **Authorized Domains** section

### Step 4: Add localhost
1. Click **"+ Add domain"** button
2. Enter: `localhost`
3. Click **Add**

### Step 5: Also Add These Domains (for production)
When you deploy, also add:
- `localhost:3000` (development)
- `127.0.0.1` (local testing)
- Your actual domain (production)

---

## 🧪 Test After Configuration

After adding localhost to authorized domains:

1. **Refresh the app** at http://localhost:3000
2. Click **LOG IN** → Try **Google**, **GitHub**, or **Apple** button
3. OAuth should now work!

---

## ⏱️ Timing
Changes may take 1-2 minutes to propagate in Firebase. If it still doesn't work:
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Try an incognito/private window

---

## 📧 Alternative: Use Email/Password in the Meantime

While you're setting up OAuth, you can:
- Sign up with **Email & Password** (fully functional)
- Use **SMS Code** verification (phone-based auth)
- These don't require domain whitelisting

---

## 🆘 Still Having Issues?

If you still see the error after adding localhost:

### Quick Checklist:
- ✅ Logged into Firebase Console?
- ✅ In the correct project ("nodal-plating-zjlsj")?
- ✅ Added "localhost" to Authorized Domains?
- ✅ Waited 1-2 minutes?
- ✅ Cleared browser cache?
- ✅ Tried incognito window?

### Debug Steps:
1. Open **Chrome DevTools** (F12)
2. Go to **Console** tab
3. Try logging in with Google again
4. Note the exact error message
5. Share the error with your team

---

## 📌 Firebase Console Path

```
Firebase Console
  ↓
Your Project (nodal-plating-zjlsj)
  ↓
Build → Authentication
  ↓
Settings tab
  ↓
Authorized Domains section
  ↓
Click "+ Add domain"
  ↓
Enter: localhost
  ↓
Click Add
```

---

## 🎯 Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Go to Firebase Console | 🔲 TODO |
| 2 | Open Authentication → Settings | 🔲 TODO |
| 3 | Scroll to Authorized Domains | 🔲 TODO |
| 4 | Click "+ Add domain" | 🔲 TODO |
| 5 | Enter "localhost" and add | 🔲 TODO |
| 6 | Wait 1-2 minutes | 🔲 TODO |
| 7 | Refresh app and test | 🔲 TODO |

---

**Once you complete these steps, OAuth will work perfectly!** ✨
