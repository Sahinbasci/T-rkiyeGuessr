# TürkiyeGuessr Security Setup Guide

## 1. Google Maps API Key Security

### Google Cloud Console Setup

1. **API Restrictions** - Google Cloud Console > APIs & Services > Credentials
   - Click on your API key
   - Under "Application restrictions", select "HTTP referrers"
   - Add allowed domains:
     ```
     turkiyeguessr.xyz
     www.turkiyeguessr.xyz
     turkiyeguessr.xyz/*
     www.turkiyeguessr.xyz/*
     localhost:3000/*  (for development only, remove in production)
     ```

2. **API Restrictions** - Same page, under "API restrictions"
   - Select "Restrict key"
   - Enable ONLY these APIs:
     - Maps JavaScript API
     - Street View Static API (if using static images)
   - **DO NOT** enable:
     - Places API (unnecessary)
     - Directions API (unnecessary)
     - Any other API

3. **Quotas** - APIs & Services > Quotas
   - Set daily limits:
     - Maps JavaScript API: 10,000 requests/day
     - Street View: 10,000 requests/day
   - Set per-minute limits:
     - 100 requests/minute (prevents abuse)

### Environment Variables (.env.local)

```env
# Google Maps - DOMAIN RESTRICTED KEY ONLY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Firebase - These are public by design but protected by Security Rules
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

**IMPORTANT:** Never commit `.env.local` to version control.

---

## 2. Firebase Security Rules

### Deploy Security Rules

1. Go to Firebase Console > Realtime Database > Rules
2. Copy contents of `database.rules.json`
3. Publish rules

### Key Security Features

- **Room Code Validation**: Only `[A-Z0-9]{6}` format accepted
- **Player ID Validation**: Only `[a-z0-9]{10,20}` format accepted
- **Coordinate Validation**: Turkey bounds (35-43 lat, 25-46 lng)
- **Score Validation**: Max 50,000 (5000 × 10 rounds)
- **Timestamp Validation**: Cannot be in the future

---

## 3. Rate Limiting (Client-Side)

Built-in rate limits in `/src/utils/rateLimiter.ts`:

| Action | Limit | Window |
|--------|-------|--------|
| Room Creation | 3/min | 60s |
| Room Join | 10/min | 60s |
| Guess Submit | 5/round | 5min |
| API Calls | 30/min | 60s |

---

## 4. Room Lifecycle Management

Automatic cleanup in `/src/services/roomLifecycle.ts`:

| Condition | Action | Delay |
|-----------|--------|-------|
| Empty Room | Delete | 5 min |
| Finished Game | Delete | 30 min |
| Inactive Player | Mark inactive | 3 min |

---

## 5. Cost Monitoring

API usage tracking in `/src/utils/apiCostMonitor.ts`:

- Daily budget: $50 USD
- Max daily calls: ~7,142 (at $0.007/call)
- LocalStorage tracking
- Budget exceeded warning

### Monitoring Commands (Browser Console)

```javascript
// Check today's API usage
__apiCostMonitor.getStats()

// Check if budget exceeded
__apiCostMonitor.isBudgetExceeded()

// Reset daily counters (testing only)
__apiCostMonitor.resetDaily()
```

---

## 6. Production Checklist

Before launching:

- [ ] Google Maps API key is domain-restricted
- [ ] Firebase Security Rules are deployed
- [ ] `.env.local` is in `.gitignore`
- [ ] No API keys in client-side code
- [ ] Rate limits tested
- [ ] Room cleanup tested
- [ ] Error handling tested on slow networks
- [ ] Mobile/Safari tested

---

## 7. Incident Response

### API Key Leaked

1. Immediately rotate key in Google Cloud Console
2. Update `.env.local` in Vercel
3. Redeploy

### Budget Exceeded

1. Check `__apiCostMonitor.getStats()` for usage
2. Increase quota temporarily in Google Cloud
3. Investigate abuse patterns in Firebase

### Firebase Abuse

1. Check Realtime Database usage in Firebase Console
2. Tighten security rules if needed
3. Consider enabling Firebase App Check for additional protection
