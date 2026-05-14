# Supabase Setup Guide

## 🚀 Initial Setup

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Get credentials from Settings → API

### 2. Apply Initial Schema
1. Go to SQL Editor
2. Create new query
3. Copy-paste content from `supabase/migrations/001_initial_schema.sql`
4. Click "RUN"

✅ **Done:** Tables created with initial RLS policies

---

## 🔒 Apply RLS Fixes (IMPORTANT)

⚠️ **CRITICAL:** Initial schema has weak security policies. Must apply fixes!

### Steps:
1. Go to SQL Editor → New query
2. Copy-paste content from `supabase/migrations/002_rls_fixes.sql`
3. Click "RUN"

### What Gets Fixed:
- ✅ Likes: Users can only view own likes (not everyone's)
- ✅ Posts: Like count updated via trigger (safer)
- ✅ Profiles: Stays public read, private write

### Verify:
1. Go to Authentication → Users → Create test user
2. Login as user1
3. Try to update user2's profile → SHOULD FAIL ✓
4. Try to view your own profile → SHOULD WORK ✓
5. Try to see user2's likes → SHOULD FAIL ✓

---

## 📦 Environment Variables

### Add to `.env.local` (never commit!):
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON=eyJxx...
```

Get from Supabase Dashboard:
1. Settings → API
2. Copy "Project URL" and "anon public" key

---

## 🧪 Test RLS Policies

### From Supabase Console:
```sql
-- Test 1: User sees own profile
SELECT * FROM profiles WHERE id = auth.uid();  -- ✓ WORKS

-- Test 2: User can't see other profiles (but policy allows)
SELECT * FROM profiles;  -- ✓ See all (privacy choice)

-- Test 3: User can't update others' profiles
UPDATE profiles SET display_name = 'Hacked' WHERE id != auth.uid();  -- ❌ FAILS

-- Test 4: Like count updates automatically
INSERT INTO likes (post_id, user_id) VALUES (post_uuid, auth.uid());
-- Check posts.like_count → should increment ✓
```

---

## 📋 Checklist

- [ ] Supabase project created
- [ ] 001_initial_schema.sql applied
- [ ] 002_rls_fixes.sql applied
- [ ] Environment variables set in .env.local
- [ ] Test user created
- [ ] RLS policies verified (see "Verify" section above)
- [ ] Storage bucket "outfit-posts" created (public)

---

## 🚨 Common Issues

### "auth.uid() is undefined"
→ User not logged in. Login first in app.

### "permission denied for schema public"
→ User doesn't have correct role. Check Supabase Auth settings.

### Can see other users' data
→ RLS policies not applied. Run 002_rls_fixes.sql again.

---

**Next:** Run `npm run test` to verify app works with Supabase
