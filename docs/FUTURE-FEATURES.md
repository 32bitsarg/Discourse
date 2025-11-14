# Future Features & Improvements

This document outlines planned features, improvements, and enhancements for the Discourse platform. Features are categorized by priority to help guide development efforts.

## High Priority - Security & Core Functionality

### 1. CAPTCHA System
**Status:** Configuration exists in dashboard, validation functions in `lib/settings-validation.ts`, but not implemented.

**Missing:**
- Validation in `/api/auth/register` when `captcha_on_registration = true`
- Validation in `/api/posts/create` when `captcha_on_posts = true`
- Frontend component (reCAPTCHA v3, hCaptcha, etc.)

**Impact:** Critical for preventing spam and bots

---

### 2. Email Verification
**Status:** Configuration exists in dashboard, validation function exists, but not implemented.

**Missing:**
- `email_verified` field in `users` table
- Email verification tokens table (`email_verification_tokens`)
- Send email with token on registration
- Endpoint `/api/auth/verify-email`
- Validation on login if `email_verification_required = true`
- Frontend page to verify email

**Impact:** Critical for security and user quality

---

### 3. Nested Comments (Partially Implemented)
**Status:** Database supports `parent_id`, frontend shows `replies`, but API doesn't load replies.

**Missing:**
- Load replies in `/api/posts/[id]/comments` (recursive or with depth limit)
- UI to reply to specific comments
- Depth limit (e.g., 5 levels max)

**Impact:** High - Essential for Reddit-like forum functionality

---

## Medium Priority - Reddit-like Features

### 4. Reporting System
**Status:** Doesn't exist.

**Missing:**
- `reports` table (post_id, comment_id, user_id, reason, status)
- Endpoint `/api/reports/create`
- Moderation panel to view reports
- Actions: delete, hide, warn user

**Impact:** High - Necessary for content moderation

---

### 5. Moderation System
**Status:** Roles exist (`moderator`, `admin`), but no tools.

**Missing:**
- Moderation panel for mods/admins
- Moderate posts/comments (delete, hide, pin, lock)
- Ban users from communities
- View moderation history

**Impact:** High - Essential for large communities

---

### 6. Notifications System
**Status:** Doesn't exist.

**Missing:**
- `notifications` table (user_id, type, content, read, created_at)
- Endpoint `/api/notifications`
- Notify for: replies, mentions, upvotes, new posts in followed communities
- Unread notifications badge

**Impact:** Medium - Improves user engagement

---

### 7. Saved/Hidden Posts
**Status:** Doesn't exist.

**Missing:**
- `saved_posts` table (user_id, post_id)
- `hidden_posts` table (user_id, post_id)
- Endpoints `/api/posts/[id]/save`, `/api/posts/[id]/hide`
- `/saved` page to view saved posts

**Impact:** Medium - Common Reddit functionality

---

### 8. Post Tags/Flairs
**Status:** Doesn't exist.

**Missing:**
- `post_tags` table or `tags` field in posts
- UI to add tags when creating post
- Filter posts by tags

**Impact:** Low - Nice to have

---

## Low Priority - Improvements & Optimizations

### 9. Avatar/Banner Validation
**Status:** Configuration exists, not validated on upload.

**Missing:** Validation in `/api/user/profile` before allowing `avatar_url` or `banner_url` updates.

**Impact:** Low

---

### 10. Advanced Search
**Status:** Basic search exists.

**Missing:**
- Filter by community, author, date
- Search in comments
- Sort results

**Impact:** Low

---

### 11. Statistics & Analytics
**Status:** Basic stats exist.

**Missing:**
- Dashboard with charts (posts per day, active users, most popular communities)
- Analytics per community

**Impact:** Low - Useful for admins

---

## WordPress Self-Hosted Features

### 12. Backup System
**Status:** Doesn't exist.

**Missing:**
- Script to backup database
- Scheduled automatic backups
- Restore from backup

**Impact:** Medium - Important for production

---

### 13. Automatic Updates
**Status:** Doesn't exist.

**Missing:**
- System to check for new versions
- Update installer from dashboard
- Automatic database migrations

**Impact:** Low - Can be manual for now

---

### 14. System Logs
**Status:** Doesn't exist.

**Missing:**
- `system_logs` table (action, user_id, details, created_at)
- View logs in dashboard
- Filter by action type

**Impact:** Low - Useful for debugging

---

## Priority Summary

### Critical (Implement First)
1. **CAPTCHA** - Prevent spam
2. **Email Verification** - Security
3. **Nested Comments** - Core functionality

### High (Implement Next)
4. **Reporting System**
5. **Moderation System**
6. **Notifications**

### Medium (Important Improvements)
7. **Saved/Hidden Posts**
8. **Backup System**

### Low (Nice to Have)
9. Avatar/Banner validation
10. Advanced search
11. Advanced statistics
12. Tags/Flairs
13. Automatic updates
14. System logs

---

## Implementation Recommendations

**Start with:**
1. **Nested Comments** (complete existing functionality)
2. **CAPTCHA** (critical security)
3. **Email Verification** (critical security)

**Then:**
4. **Reporting System**
5. **Moderation System**

---

## Notes

- This document should be updated as features are implemented
- Priorities may change based on user feedback and requirements
- Some features may require database schema changes
- Consider backward compatibility when implementing new features

