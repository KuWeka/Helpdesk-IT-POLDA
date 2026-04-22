# ProjectPolda - Comprehensive Remediation Plan
**Date Created:** April 22, 2026  
**Document Version:** 1.0  
**Status:** Ready for Implementation

---

## 📌 EXECUTIVE SUMMARY

This document consolidates **10 critical issues + 8 UI/UX improvements** discovered during comprehensive code analysis, maps each issue to a specific remediation phase, and provides detailed implementation roadmap.

**Total Issues:** 18  
**Total Phases:** 8  
**Estimated Duration:** 20-25 hours  
**Priority Order:** Security → Critical UX → Logic → Dependencies → Visual Enhancements

---

## 🔴 CRITICAL ISSUES (MUST FIX BEFORE PRODUCTION)

### **ISSUE #1: Debug console.log Exposing Sensitive Data**
- **Severity:** 🔴 CRITICAL (Security)
- **Location:** `apps/web/src/pages/CreateTicketPage.jsx` (lines 84, 88)
- **Problem:**
  ```javascript
  console.log('DEBUG [CreateTicketPage]: Creating new ticket with payload:', ticketData);
  console.log('DEBUG [CreateTicketPage]: Ticket successfully created:', ticketRecord);
  ```
  These logs expose sensitive data (user ID, ticket details, attachments) in browser DevTools. Any user can see this data in production.
- **Risk:** Information disclosure, privacy violation, GDPR compliance issue
- **Remediation Phase:** **PHASE 1**
- **Deliverable:** Remove all DEBUG logs before production build

---

### **ISSUE #2: Password Change Without Old Password Verification**
- **Severity:** 🔴 CRITICAL (Security)
- **Location:** `apps/web/src/pages/UserSettingsPage.jsx` (handlePasswordSave function)
- **Problem:**
  ```javascript
  // Intentionally omitting oldPassword check for simplicity in this frontend refactor, 
  // backend will replace the hash if authorized
  await api.patch(`/users/${currentUser.id}`, {
    password: passwordData.newPassword
  });
  ```
  - Frontend sends only newPassword, no oldPassword verification
  - Comment suggests backend also doesn't validate
  - **Anyone with access to logged-in browser can change user's password**
- **Risk:** Account takeover, unauthorized password reset, session hijacking
- **Remediation Phase:** **PHASE 1**
- **Deliverables:**
  1. Backend: Add oldPassword validation in `/users/{id}` PATCH endpoint
  2. Frontend: Add oldPassword input field in UserSettingsPage
  3. Frontend: Send oldPassword in API request

---

### **ISSUE #3: Ticket Number Generated in Frontend (Not Server-Side)**
- **Severity:** 🔴 CRITICAL (Security + Data Integrity)
- **Location:** `apps/web/src/pages/CreateTicketPage.jsx` (lines 74-75)
- **Problem:**
  ```javascript
  const dateStr = format(new Date(), 'yyyyMMdd');
  const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const ticketNumber = `TKT-${dateStr}-${randomStr}`;
  ```
  - Multiple users can generate identical ticket numbers (collision risk)
  - Users can guess/manipulate valid ticket numbers
  - No audit trail for ticket creation
  - Duplicate ticket numbers possible across system
- **Risk:** Data integrity violation, ticket lookup conflicts, audit trail corruption
- **Remediation Phase:** **PHASE 1**
- **Deliverables:**
  1. Backend: Modify `/tickets` POST endpoint to generate ticket_number
  2. Backend: Implement unique ticket number generation (database sequence or timestamp-based ID)
  3. Frontend: Remove ticket number generation logic
  4. Frontend: Receive ticket_number in API response

---

### **ISSUE #4: HomePage Completely Empty**
- **Severity:** 🔴 CRITICAL (UX Breaking Change)
- **Location:** `apps/web/src/pages/HomePage.jsx`
- **Problem:**
  ```jsx
  const HomePage = () => {
    return (
      <div>
      </div>
    )
  }
  ```
  - Route `/` shows blank page to all users
  - Broken user experience when accessing root URL
  - No login redirect or welcome page
- **User Impact:** Users see broken/empty page, no guidance on what to do
- **Remediation Phase:** **PHASE 2**
- **Deliverables:**
  1. Add authentication check
  2. Redirect unauthenticated users to LoginPage
  3. Redirect authenticated users to appropriate dashboard (admin/technician/user)

---

### **ISSUE #5: Dashboard Insight Cards Show Placeholder Text (12 cards)**
- **Severity:** 🔴 CRITICAL (UX/Professionalism)
- **Locations:** 
  - `apps/web/src/pages/UserDashboard.jsx` (lines 137-161) → 4 cards
  - `apps/web/src/pages/technician/TechnicianDashboard.jsx` (line 200) → 4 cards
  - `apps/web/src/pages/admin/AdminDashboard.jsx` (line 205) → 4 cards
- **Problem:**
  All 12 cards display placeholder text to users:
  ```
  (Placeholder chart: implementasi tren tiket per minggu/bulan di sini)
  (Placeholder SLA: tampilkan % tiket selesai tepat waktu)
  (Placeholder aging: tampilkan jumlah tiket >3 hari belum selesai)
  (Placeholder prioritas: tampilkan tiket prioritas/action hari ini)
  ```
  This looks extremely unprofessional and suggests system is incomplete.
- **User Impact:** Loses confidence in system, appears unfinished
- **Remediation Phase:** **PHASE 2**
- **Deliverables:**
  1. Replace with actual Recharts components (LineChart, AreaChart, BarChart, etc.)
  2. Create reusable `InsightCard` component
  3. Each dashboard shows relevant metrics with real data
  4. Add skeleton loading states

---

## 🟡 HIGH-PRIORITY LOGIC ISSUES

### **ISSUE #6: Stats Calculated Inefficiently in Frontend**
- **Severity:** 🟡 HIGH (Performance + Logic)
- **Location:** `apps/web/src/pages/UserDashboard.jsx` (useEffect, lines ~30-60)
- **Problem:**
  ```javascript
  const res = await api.get('/tickets');
  const allData = extractItems(res.data);  // Fetch ALL tickets
  setTickets(allData.slice(0, 10));
  
  const newStats = { pending: 0, proses: 0, selesai: 0 };
  allData.forEach(tk => {
    if (tk.status === TICKET_STATUS.PENDING) newStats.pending++;
    // ... manual counting in frontend
  });
  ```
  - Fetches **all tickets** just to count statistics
  - Inefficient for systems with thousands of tickets
  - Manual counting in frontend (should be backend job)
  - Wasted network bandwidth
- **Performance Impact:** Slower page load, increased data transfer
- **Remediation Phase:** **PHASE 3**
- **Deliverables:**
  1. Backend: Create `/tickets/summary` GET endpoint
  2. Backend: Return pre-calculated stats (pending, proses, selesai, aging, sla_compliance, trend)
  3. Frontend: Replace full fetch with `/tickets/summary` call
  4. Frontend: Display stats directly from response

---

### **ISSUE #7: Notification Settings Mocked, Not Actually Saved**
- **Severity:** 🟡 HIGH (Logic + Trust)
- **Location:** `apps/web/src/pages/UserSettingsPage.jsx` (handleNotifSave function)
- **Problem:**
  ```javascript
  const handleNotifSave = async () => {
    setIsLoading(true);
    try {
      // Backend does not currently support notification settings for general users, mock success
      toast.success('Pengaturan notifikasi berhasil diperbarui');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan notifikasi');
    }
  };
  ```
  - User toggles notification preferences
  - System shows "saved successfully"
  - **But settings are NOT actually saved**
  - User expects settings to persist, they don't
- **User Impact:** Broken trust, settings "disappear" on reload
- **Remediation Phase:** **PHASE 3**
- **Deliverables:**
  1. Option A: Implement backend `/users/{id}/notification-settings` endpoint
  2. Option B: Remove notification settings UI (if not in roadmap)
  3. Choose one approach, implement fully or remove UI

---

## 🟡 MEDIUM-PRIORITY ISSUES

### **ISSUE #8: Unused shadcn/ui Components (25 of 55)**
- **Severity:** 🟡 MEDIUM (Bundle Size)
- **Location:** `apps/web/components.json` + `src/components/ui/`
- **Problem:**
  - 25 shadcn components installed but not used anywhere:
    - accordion, calendar, carousel, command, drawer, context-menu, hover-card, 
    - menubar, navigation-menu, pagination, popover, progress, scroll-area, sheet, 
    - etc.
  - Each component adds to final bundle size
  - Increases build time, final package size
- **Impact:** ~50KB+ bundle bloat
- **Remediation Phase:** **PHASE 4**
- **Deliverables:**
  1. Audit all used vs. unused components
  2. Remove 25 unused components from `components.json`
  3. Delete unused component files from `src/components/ui/`
  4. Verify no import errors

---

### **ISSUE #9: Unused npm Dependencies (5 packages)**
- **Severity:** 🟡 MEDIUM (Bundle Size + Install Time)
- **Location:** `apps/web/package.json`
- **Problem:**
  Packages installed but not used:
  - `zustand@^5.0.12` → State management (0 usages, using React Context instead)
  - `framer-motion@^11.15.0` → Animation library (0 usages)
  - `react-helmet@^6.1.0` → Meta tags (0 usages)
  - `@tanstack/react-table@^8.21.3` → Table utilities (using shadcn Table instead)
  - `next-themes@^0.4.6` → Theme manager (only 1 usage, manual solution sufficient)
- **Impact:** ~200KB bundle bloat, slower npm install (5-10 seconds)
- **Remediation Phase:** **PHASE 4**
- **Deliverables:**
  1. Remove packages via `npm uninstall [package]`
  2. Update `package.json`
  3. Run tests to verify no errors

---

### **ISSUE #10: Vite Plugins for Visual Editor Not Needed**
- **Severity:** 🟡 MEDIUM (Config Cleanup)
- **Location:** `apps/web/vite.config.js` (lines 1-6, ~70 lines total)
- **Problem:**
  Config contains Hostinger builder plugins not needed for final system:
  ```javascript
  import inlineEditPlugin from './plugins/visual-editor/vite-plugin-react-inline-editor.js';
  import editModeDevPlugin from './plugins/visual-editor/vite-plugin-edit-mode.js';
  import selectionModePlugin from './plugins/selection-mode/vite-plugin-selection-mode.js';
  import iframeRouteRestorationPlugin from './plugins/vite-plugin-iframe-route-restoration.js';
  ```
  - Adds ~100 lines of config code
  - Handlers for Horizons error catching
  - Not part of production system
- **Impact:** Cleaner build config, faster Vite startup
- **Remediation Phase:** **PHASE 4**
- **Deliverables:**
  1. Remove plugin imports
  2. Remove plugin registrations from plugins array
  3. Remove associated handler code (configHorizonsViteErrorHandler, etc.)
  4. Keep only React plugin

---

## 🎨 UI/UX ENHANCEMENT ISSUES

### **ISSUE #11: Login Page Too Generic and Plain**
- **Severity:** 🎨 MEDIUM (Visual Polish)
- **Location:** `apps/web/src/pages/LoginPage.jsx`
- **Problem:**
  - Plain white card in center of screen
  - Generic Globe icon (could be any app)
  - No system branding or identity
  - No visual hierarchy or differentiation
  - Compared to enterprise helpdesk systems (Freshdesk, Jira, Zendesk), looks basic
  - No trust-building visual elements (logo, company info, etc.)
- **User Experience:** Low confidence in system, no professional impression
- **Remediation Phase:** **PHASE 6**
- **Deliverables:**
  1. Add branded background (gradient or hero image)
  2. Add system logo/icon (replace generic Globe)
  3. Add system name prominently
  4. Add tagline/description
  5. Improve card styling (shadow, border)
  6. Add "Forgot Password" link
  7. Responsive design for all screen sizes

---

### **ISSUE #12: Header Too Minimalist, Missing Key Features**
- **Severity:** 🎨 MEDIUM (UX Enhancement)
- **Location:** `apps/web/src/components/layout/header.jsx`
- **Problem:**
  Current header only has:
  - Breadcrumb navigation
  - User name + role (text only)
  - Language toggle (Globe icon)
  - Theme toggle (Sun/Moon icon)
  - Logout button
  
  Missing:
  - **Notification bell** - System has real-time chat, no notification indicator
  - **User avatar** - Just text, no visual identity
  - **Quick actions** - No role-specific shortcuts
  - **Search/command bar** - Can't quickly find tickets
- **User Impact:** Less intuitive navigation, important notifications missed
- **Remediation Phase:** **PHASE 5**
- **Deliverables:**
  1. Add notification bell icon with dropdown
  2. Show unread notification count
  3. Replace text username with Avatar component
  4. Add quick action buttons (role-specific)
  5. Optional: Add search/command bar

---

### **ISSUE #13: Sidebar Branding Shows Internal Project Name**
- **Severity:** 🎨 MEDIUM (Professionalism)
- **Location:** `apps/web/src/components/layout/app-sidebar.jsx` (line ~19)
- **Problem:**
  ```jsx
  <span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
    ProjectPolda  {/* ← Internal project name visible to users */}
  </span>
  ```
  - Users see internal project codename "ProjectPolda"
  - Should show professional system name (e.g., "IT Helpdesk", "Support System")
  - Unprofessional appearance
- **User Impact:** Confusion about system identity, looks unfinished
- **Remediation Phase:** **PHASE 5**
- **Deliverables:**
  1. Replace "ProjectPolda" with proper system name
  2. Consider branding guidelines
  3. May need to update in multiple places

---

### **ISSUE #14: Inconsistent Component Usage (Headers)**
- **Severity:** 🎨 LOW (Code Quality)
- **Location:** Multiple page components
- **Problem:**
  Different pages use different header patterns:
  - UserDashboard: Uses `<SectionHeader>` component
  - LoginPage: Uses `<Card><CardHeader>` + `<CardTitle>`
  - SettingsPage: Uses raw `<h1>` + `<p>`
  - Other pages: Mixed patterns
  
  No consistent pattern across application.
- **Impact:** Inconsistent user experience, harder to maintain
- **Remediation Phase:** **PHASE 7**
- **Deliverables:**
  1. Standardize on one pattern: **`<SectionHeader>` everywhere**
  2. Audit all pages for compliance
  3. Create coding guidelines document
  4. Replace all raw `<h1>` with `<SectionHeader>`

---

### **ISSUE #15: Inconsistent Empty State Implementations**
- **Severity:** 🎨 LOW (UX Consistency)
- **Location:** Multiple pages showing empty states
- **Problem:**
  - Some pages use hardcoded inline SVG for empty state
  - Other pages use `<Empty>` component from shadcn
  - Inconsistent messaging
  - Different visual styles
- **Impact:** Fragmented UX, looks like different apps
- **Remediation Phase:** **PHASE 7**
- **Deliverables:**
  1. Standardize to `<Empty>` component everywhere
  2. Create variants for: no results, error, offline, no permissions
  3. Standard message templates
  4. Update all pages with consistent empty states

---

### **ISSUE #16: Tables Not Mobile Responsive (Horizontal Scroll Missing)**
- **Severity:** 🎨 LOW (Mobile UX)
- **Location:** 
  - `apps/web/src/pages/AllTickets.jsx`
  - `apps/web/src/pages/TicketHistory.jsx`
  - `apps/web/src/pages/admin/AdminDashboard.jsx` (tickets table)
- **Problem:**
  - Tables have many columns
  - No horizontal scroll wrapper on mobile
  - Columns get cut off on small screens
  - Text overlaps, becomes unreadable
- **User Impact:** Tables unusable on mobile devices
- **Remediation Phase:** **PHASE 8**
- **Deliverables:**
  1. Wrap tables in `overflow-x-auto` div
  2. Add responsive classes
  3. Test on various mobile screen sizes

---

### **ISSUE #17: Chat UI Extremely Basic, Missing Key Features**
- **Severity:** 🎨 LOW (Visual Polish)
- **Location:** Chat component files
- **Problem:**
  - Message bubbles lack visual differentiation
  - No clear sent vs. received indication (color, position)
  - No timestamps on messages
  - No read status indicator
  - No typing indicator animation
  - No user avatars in chat
- **User Impact:** Confusing message flow, no context on when messages were sent
- **Remediation Phase:** **PHASE 8**
- **Deliverables:**
  1. Style sent messages (right-aligned, primary color)
  2. Style received messages (left-aligned, muted color)
  3. Add timestamps (per message or per group)
  4. Add read status (✓ sent, ✓✓ delivered/read)
  5. Add typing indicator ("User is typing...")
  6. Add sender avatar on messages

---

### **ISSUE #18: Sidebar Branding Inconsistency Across Roles**
- **Severity:** 🎨 LOW (Minor UX Issue)
- **Location:** `apps/web/src/components/layout/app-sidebar.jsx`
- **Problem:**
  All roles see same branding "ProjectPolda"
  - Should potentially show role-specific context or system name
  - Minor issue but contributes to professionalism
- **Remediation Phase:** **PHASE 5** (part of branding update)
- **Deliverables:**
  1. Update to consistent professional system name

---

---

# 📋 REMEDIATION PHASES - DETAILED EXECUTION PLAN

## ⏱️ PHASE 1: CRITICAL SECURITY FIXES
**Duration:** 3-4 hours  
**Priority:** 🔴 BLOCKING - Must complete before production  
**Issues Addressed:** #1, #2, #3

### 1.1 Remove DEBUG Console Logs
**Task:** Delete all `console.log('DEBUG...')` statements

**File:** `apps/web/src/pages/CreateTicketPage.jsx`
```
Changes:
- Remove line 84: console.log('DEBUG [CreateTicketPage]: Creating new ticket with payload:', ticketData);
- Remove line 88: console.log('DEBUG [CreateTicketPage]: Ticket successfully created:', ticketRecord);
```

**Testing:**
- [ ] Run production build
- [ ] Open browser DevTools → Console
- [ ] Verify NO DEBUG messages appear
- [ ] Check in Chrome DevTools Network tab

---

### 1.2 Implement Password Change Security

**Files to Modify:**
1. **Backend** - Need to verify/create `/users/{id}` PATCH endpoint
   - Requirement: Validate `oldPassword` before accepting change
   - Compare oldPassword hash with current password hash
   - Only update if match
   - Return error if mismatch

2. **Frontend** - `apps/web/src/pages/UserSettingsPage.jsx`
   - Add `oldPassword` field to password form
   - Display in UI (required field)
   - Send oldPassword in API request along with newPassword

**Testing:**
- [ ] Try change password without old password → Error
- [ ] Try wrong old password → Error
- [ ] Try correct old password with new password → Success
- [ ] Verify password actually changed (can login with new password)
- [ ] Verify cannot login with old password

---

### 1.3 Move Ticket Number Generation to Backend

**Files to Modify:**

1. **Backend** - `/tickets` POST endpoint
   - Generate ticket_number server-side (database sequence or timestamp-based)
   - Return in API response
   - Ensure uniqueness via database constraint

2. **Frontend** - `apps/web/src/pages/CreateTicketPage.jsx`
   - Remove lines 74-75 (ticket number generation)
   - Remove `ticket_number` from ticketData object before sending
   - Receive `ticket_number` from API response
   - Display returned ticket_number to user

**Implementation:**
```javascript
// REMOVE THIS (lines 74-75):
const dateStr = format(new Date(), 'yyyyMMdd');
const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
const ticketNumber = `TKT-${dateStr}-${randomStr}`;

// REMOVE FROM ticketData:
const ticketData = {
  // ticket_number: ticketNumber, ← REMOVE THIS LINE
  title: formData.title,
  description: formData.description,
  location: formData.location,
  urgency: formData.urgency,
  status: 'Pending',
  user_id: currentUser.id
};

// USE RESPONSE ticket_number:
const { data: ticketRecord } = await api.post('/tickets', ticketData);
console.log('Ticket created with number:', ticketRecord.ticket_number); // Use this
```

**Testing:**
- [ ] Create multiple tickets in quick succession
- [ ] Verify all ticket numbers are unique
- [ ] Verify ticket numbers follow consistent format
- [ ] Verify cannot manually create duplicate ticket numbers
- [ ] Verify ticket numbers are sequential/unpredictable

---

### 1.4 Phase 1 Testing Checklist
```
Security:
- [ ] No console.log output in production
- [ ] Password change requires old password
- [ ] Cannot change password with wrong old password
- [ ] Ticket numbers always unique
- [ ] Ticket numbers cannot be predicted/manipulated
- [ ] No sensitive data in browser console
```

---

## ⏱️ PHASE 2: CRITICAL UX FIXES
**Duration:** 4-5 hours  
**Priority:** 🔴 BLOCKING - Users see broken pages  
**Issues Addressed:** #4, #5

### 2.1 Fix HomePage (Empty Page)

**File:** `apps/web/src/pages/HomePage.jsx`

**Current Code:**
```jsx
const HomePage = () => {
  return (
    <div>
    </div>
  )
}
```

**Solution:** Add redirect logic

```jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

export default function HomePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      // Redirect to role-specific dashboard
      const dashboardPath = 
        currentUser.role === 'Admin' ? '/admin/dashboard' :
        currentUser.role === 'Teknisi' ? '/technician/dashboard' :
        '/user/dashboard';
      navigate(dashboardPath);
    }
  }, [currentUser, navigate]);

  return null; // Don't render anything while redirecting
}
```

**Testing:**
- [ ] Unauthenticated user at `/` → redirects to `/login`
- [ ] Authenticated Admin at `/` → redirects to `/admin/dashboard`
- [ ] Authenticated Technician at `/` → redirects to `/technician/dashboard`
- [ ] Authenticated User at `/` → redirects to `/user/dashboard`

---

### 2.2 Replace 12 Placeholder Insight Cards

**Files to Modify:**
1. `apps/web/src/pages/UserDashboard.jsx` (4 cards)
2. `apps/web/src/pages/technician/TechnicianDashboard.jsx` (4 cards)
3. `apps/web/src/pages/admin/AdminDashboard.jsx` (4 cards)

**Step 1: Create Reusable InsightCard Component**

Create new file: `apps/web/src/components/InsightCard.jsx`

```jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';

export default function InsightCard({ 
  title, 
  children, 
  isLoading = false,
  icon: Icon = null 
}) {
  return (
    <Card className="border-border bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Replace UserDashboard Cards**

Current (lines 137-161):
```jsx
{/* Insight Cards */}
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
  <Card className="border-border bg-card/95 shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold">Tren Tiket Bulan Ini</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-sm text-muted-foreground">(Placeholder chart: implementasi tren tiket per minggu/bulan di sini)</div>
    </CardContent>
  </Card>
  {/* ... 3 more placeholder cards ... */}
</div>
```

Replace with:
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import InsightCard from '@/components/InsightCard.jsx';
import { TrendingUp } from 'lucide-react';

// In the return JSX:
{/* Insight Cards */}
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
  <InsightCard 
    title="Tren Tiket Bulan Ini" 
    icon={TrendingUp}
    isLoading={isLoading}
  >
    {ticketTrendData && ticketTrendData.length > 0 ? (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={ticketTrendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
          <YAxis stroke="var(--color-muted-foreground)" />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="var(--color-primary)" />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <p className="text-sm text-muted-foreground">Tidak ada data trend untuk ditampilkan</p>
    )}
  </InsightCard>

  <InsightCard 
    title="SLA Penyelesaian" 
    isLoading={isLoading}
  >
    <div className="flex items-center gap-4">
      <div className="text-3xl font-bold text-primary">{slaCompliance}%</div>
      <div className="text-sm text-muted-foreground">
        dari tiket diselesaikan tepat waktu
      </div>
    </div>
  </InsightCard>

  <InsightCard 
    title="Aging Tiket" 
    isLoading={isLoading}
  >
    <div className="space-y-2">
      <div className="text-2xl font-bold text-amber-600">{agingTickets}</div>
      <p className="text-sm text-muted-foreground">Tiket > 3 hari belum selesai</p>
    </div>
  </InsightCard>

  <InsightCard 
    title="Prioritas Hari Ini" 
    isLoading={isLoading}
  >
    <div className="space-y-2">
      <div className="text-2xl font-bold text-red-600">{urgentTickets}</div>
      <p className="text-sm text-muted-foreground">Tiket prioritas tinggi menunggu</p>
    </div>
  </InsightCard>
</div>
```

**Add data fetching to useEffect:**
```javascript
// Add to UserDashboard useEffect or create separate useEffect
useEffect(() => {
  const fetchInsightData = async () => {
    try {
      // Fetch trend data
      const trendRes = await api.get('/analytics/ticket-trend?days=30');
      setTicketTrendData(trendRes.data);
      
      // Fetch stats
      const statsRes = await api.get('/tickets/summary');
      setSlaCompliance(statsRes.data.sla_compliance);
      setAgingTickets(statsRes.data.aging_count);
      setUrgentTickets(statsRes.data.urgent_count);
    } catch (err) {
      console.error('Error fetching insight data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (currentUser) {
    fetchInsightData();
  }
}, [currentUser]);
```

**Step 3: Repeat for TechnicianDashboard and AdminDashboard**

- Same InsightCard component pattern
- Adjust metrics based on role
- For Admin: Total tickets, active technicians, SLA performance
- For Technician: Assigned tickets, queue status, personal SLA

**Testing:**
- [ ] UserDashboard shows real trend chart (not placeholder text)
- [ ] TechnicianDashboard shows 4 real insight cards
- [ ] AdminDashboard shows 4 real insight cards
- [ ] Cards show skeleton while loading
- [ ] Cards show real data once loaded
- [ ] No placeholder text visible to users
- [ ] Charts render correctly with data
- [ ] Responsive on mobile

---

### 2.3 Phase 2 Testing Checklist
```
UX:
- [ ] HomePage not blank for any user type
- [ ] All dashboard redirects work
- [ ] 12 insight cards showing real data (no placeholders)
- [ ] Charts render with Recharts
- [ ] Loading states show skeletons
- [ ] Mobile responsive for dashboards
```

---

## ⏱️ PHASE 3: LOGIC & EFFICIENCY FIXES
**Duration:** 5-6 hours  
**Priority:** 🟡 HIGH - Performance & correctness  
**Issues Addressed:** #6, #7

### 3.1 Create Backend `/tickets/summary` Endpoint

**Backend Implementation:**

Create new route file: `backend/src/routes/tickets-summary.js` or add to existing tickets route

```javascript
// GET /api/tickets/summary?role=user&userId={id}&dashboardType=user|technician|admin
async (req, res) => {
  const { role, userId, dashboardType = 'user' } = req.query;
  
  try {
    let query = 'SELECT status, COUNT(*) as count FROM tickets';
    let params = [];
    
    // Filter by role/user
    if (role === 'user' && userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    // Admin sees all, Technician sees assigned
    else if (role === 'technician' && userId) {
      query += ' WHERE assigned_to = ?';
      params.push(userId);
    }
    
    query += ' GROUP BY status';
    
    const [stats] = await db.promise().query(query, params);
    
    // Convert to named counts
    const summary = {
      pending: stats.find(s => s.status === 'Pending')?.count || 0,
      proses: stats.find(s => s.status === 'Proses')?.count || 0,
      selesai: stats.find(s => s.status === 'Selesai')?.count || 0,
      sla_compliance: 92.5, // Calculate based on closed tickets
      aging_count: 5, // Tickets >3 days without closure
      urgent_count: 3, // High priority pending tickets
      trend: [ // Last 7 days
        { date: 'Mon', count: 5 },
        { date: 'Tue', count: 8 },
        // ... 7 data points
      ]
    };
    
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
```

---

### 3.2 Refactor UserDashboard to Use `/tickets/summary`

**File:** `apps/web/src/pages/UserDashboard.jsx`

**Remove old code (lines ~30-60):**
```javascript
// OLD - REMOVE THIS:
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/tickets');  // Fetches ALL tickets
      const allData = extractItems(res.data);
      
      setTickets(allData.slice(0, 10));

      const newStats = { pending: 0, proses: 0, selesai: 0 };
      allData.forEach(tk => {
        if (tk.status === TICKET_STATUS.PENDING) newStats.pending++;
        if (tk.status === TICKET_STATUS.PROSES) newStats.proses++;
        if (tk.status === TICKET_STATUS.SELESAI) newStats.selesai++;
      });
      setStats(newStats);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser) {
    fetchDashboardData();
  }
}, [currentUser]);
```

**Replace with new code:**
```javascript
// NEW - REPLACE WITH THIS:
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      // Fetch only summary stats
      const summaryRes = await api.get('/tickets/summary', {
        params: { role: 'user', userId: currentUser.id }
      });
      
      setStats({
        pending: summaryRes.data.pending,
        proses: summaryRes.data.proses,
        selesai: summaryRes.data.selesai
      });
      
      // Fetch recent tickets (separate call, limit 10)
      const ticketsRes = await api.get('/tickets?limit=10');
      setTickets(extractItems(ticketsRes.data));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser) {
    fetchDashboardData();
  }
}, [currentUser]);
```

**Benefits:**
- Faster dashboard load (1 summary query instead of 1 all-tickets query)
- Cleaner frontend code
- Server-side calculation efficiency
- Scalable to thousands of tickets

---

### 3.3 Implement or Remove Notification Settings

**File:** `apps/web/src/pages/UserSettingsPage.jsx`

**Option A: Remove Notification Settings (Simpler)**

If notification settings not in current roadmap:

```javascript
// In handleNotifSave - either:

// Option 1: Remove entire tab
// Delete from TabsList and TabsContent

// Option 2: Hide/disable in tab
const handleNotifSave = async () => {
  toast.info('Pengaturan notifikasi akan datang di update mendatang');
};
```

**Option B: Implement Backend Support**

If keeping notification settings:

1. **Backend:** Add endpoint `/users/{id}/notification-settings`
   ```javascript
   // PATCH /api/users/{id}/notification-settings
   {
     "email_notifications": true,
     "chat_notifications": true,
     "ticket_notifications": true,
     "sms_notifications": false
   }
   ```

2. **Frontend:** Update handleNotifSave
   ```javascript
   const handleNotifSave = async () => {
     setIsLoading(true);
     try {
       await api.patch(`/users/${currentUser.id}/notification-settings`, notifData);
       toast.success('Pengaturan notifikasi berhasil disimpan');
     } catch (err) {
       toast.error('Gagal menyimpan pengaturan notifikasi');
     } finally {
       setIsLoading(false);
     }
   };
   ```

**Recommendation:** Go with Option A (remove) unless notifications are in scope.

---

### 3.4 Phase 3 Testing Checklist
```
Logic:
- [ ] /tickets/summary endpoint exists and returns correct data
- [ ] UserDashboard stats match summary API response
- [ ] Summary API faster than fetching all tickets
- [ ] Notification settings either removed or properly saved
- [ ] No data inconsistency between API responses
```

---

## ⏱️ PHASE 4: DEPENDENCIES & BUNDLE CLEANUP
**Duration:** 2-3 hours  
**Priority:** 🟡 MEDIUM - Clean build, reduce size  
**Issues Addressed:** #8, #9, #10

### 4.1 Remove Unused shadcn Components

**Command line:**
```bash
cd apps/web

# List all installed components
npx shadcn-ui@latest list

# Remove each unused component
npx shadcn-ui@latest remove accordion
npx shadcn-ui@latest remove calendar
npx shadcn-ui@latest remove carousel
npx shadcn-ui@latest remove command
npx shadcn-ui@latest remove context-menu
npx shadcn-ui@latest remove drawer
# ... (repeat for all 25 unused)
```

**Or manually:**
1. Open `apps/web/components.json`
2. Identify which components are actually imported in codebase
3. Delete unused component files from `src/components/ui/`
4. Update `components.json` registries

**Verification:**
```bash
# Run build to verify no import errors
npm run build

# Check bundle size reduction
# Should see ~50KB+ reduction
```

---

### 4.2 Remove Unused npm Packages

**Packages to remove:**
```bash
cd apps/web

npm uninstall zustand
npm uninstall framer-motion
npm uninstall react-helmet
npm uninstall @tanstack/react-table
npm uninstall next-themes
```

**Verify in package.json - should be removed:**
```json
// These should NOT appear in package.json after:
"zustand": "^5.0.12",
"framer-motion": "^11.15.0",
"react-helmet": "^6.1.0",
"@tanstack/react-table": "^8.21.3",
"next-themes": "^0.4.6",
```

**Testing:**
```bash
# Install dependencies
npm install

# Build and verify no errors
npm run build

# Run tests
npm test

# Check for runtime errors
npm run dev
```

---

### 4.3 Remove Vite Plugins (Visual Editor)

**File:** `apps/web/vite.config.js`

**Current (lines 1-7):**
```javascript
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import inlineEditPlugin from './plugins/visual-editor/vite-plugin-react-inline-editor.js';
import editModeDevPlugin from './plugins/visual-editor/vite-plugin-edit-mode.js';
import selectionModePlugin from './plugins/selection-mode/vite-plugin-selection-mode.js';
import iframeRouteRestorationPlugin from './plugins/vite-plugin-iframe-route-restoration.js';
```

**Change to:**
```javascript
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
// Remove: import inlineEditPlugin from './plugins/visual-editor/vite-plugin-react-inline-editor.js';
// Remove: import editModeDevPlugin from './plugins/visual-editor/vite-plugin-edit-mode.js';
// Remove: import selectionModePlugin from './plugins/selection-mode/vite-plugin-selection-mode.js';
// Remove: import iframeRouteRestorationPlugin from './plugins/vite-plugin-iframe-route-restoration.js';
```

**In defineConfig plugins array - REMOVE:**
```javascript
// Find plugins: [
// REMOVE these entries:
// inlineEditPlugin,
// editModeDevPlugin,
// selectionModePlugin,
// iframeRouteRestorationPlugin,
// KEEP ONLY:
// react,
```

**Also REMOVE these handlers if present (search file):**
```javascript
// Remove: configHorizonsViteErrorHandler
// Remove: configHorizonsRuntimeErrorHandler
// Remove: configHorizonsConsoleErrorHandler
// Remove: associated code that uses these handlers
```

**Testing:**
```bash
npm run dev     # Verify dev server starts
npm run build   # Verify build succeeds
```

---

### 4.4 Phase 4 Testing Checklist
```
Dependencies:
- [ ] Build size reduced by ~200KB+
- [ ] No import errors for removed components
- [ ] npm install faster (fewer packages)
- [ ] No runtime errors from removed packages
- [ ] Vite dev server starts successfully
- [ ] Production build completes without errors
```

---

## ⏱️ PHASE 5: UI HEADER & SIDEBAR ENHANCEMENTS
**Duration:** 3-4 hours  
**Priority:** 🎨 MEDIUM - Visual & UX improvements  
**Issues Addressed:** #12, #13

### 5.1 Enhance Header with Notifications

**File:** `apps/web/src/components/layout/header.jsx`

Add imports:
```javascript
import { Bell, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.jsx';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar.jsx';
import { useEffect, useState } from 'react';
```

Add notification state in Header function:
```javascript
const [unreadCount, setUnreadCount] = useState(0);
const [notifications, setNotifications] = useState([]);

useEffect(() => {
  // Fetch unread notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      setNotifications(res.data);
      const unread = res.data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  fetchNotifications();
  
  // Refresh every 30 seconds
  const interval = setInterval(fetchNotifications, 30000);
  return () => clearInterval(interval);
}, []);
```

In return JSX, add notification bell before theme toggle:
```jsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className="h-8 w-8 relative">
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent align="end" className="w-80">
    <div className="space-y-4">
      <h4 className="font-semibold">Notifikasi</h4>
      {notifications.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className="p-2 bg-muted rounded text-sm hover:bg-muted/80 cursor-pointer"
            >
              <div className="font-medium">{notif.title}</div>
              <div className="text-xs text-muted-foreground">{notif.message}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(notif.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-4">
          Tidak ada notifikasi
        </div>
      )}
    </div>
  </PopoverContent>
</Popover>
```

---

### 5.2 Enhance Header with User Avatar

In Header function, before the dropdown menu section, replace user text display:

```jsx
// BEFORE (current):
{currentUser && (
  <div className="hidden sm:flex flex-col items-end mr-2">
    <span className="text-sm font-medium">{currentUser.name || 'User'}</span>
    <span className="text-xs text-muted-foreground">{currentUser.role}</span>
  </div>
)}

// AFTER (with avatar):
{currentUser && (
  <div className="hidden sm:flex items-center gap-2 mr-2">
    <div className="flex flex-col items-end">
      <span className="text-sm font-medium">{currentUser.name || 'User'}</span>
      <span className="text-xs text-muted-foreground">{currentUser.role}</span>
    </div>
    <Avatar className="h-8 w-8">
      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
      <AvatarFallback>
        {currentUser.name?.charAt(0).toUpperCase() || 'U'}
      </AvatarFallback>
    </Avatar>
  </div>
)}
```

---

### 5.3 Fix Sidebar Branding

**File:** `apps/web/src/components/layout/app-sidebar.jsx`

**Current (line ~19):**
```jsx
<span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
  ProjectPolda
</span>
```

**Change to (replace "ProjectPolda" with professional name):**
```jsx
<span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
  IT Helpdesk
</span>
```

Or if you have a system constant file, reference it:
```jsx
import { SYSTEM_NAME } from '@/lib/constants';

// ...
<span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
  {SYSTEM_NAME}
</span>
```

Create `apps/web/src/lib/constants.js` if needed:
```javascript
export const SYSTEM_NAME = 'IT Helpdesk';
export const SYSTEM_TAGLINE = 'Fast & Reliable Support';
```

---

### 5.4 Phase 5 Testing Checklist
```
Header/Sidebar:
- [ ] Notification bell shows unread count
- [ ] Notification popover displays recent notifications
- [ ] User avatar shows in header
- [ ] Avatar fallback works (shows initial)
- [ ] Sidebar branding updated from "ProjectPolda"
- [ ] Responsive on mobile (avatar hides on small screens)
- [ ] Notifications refresh automatically
```

---

## ⏱️ PHASE 6: LOGIN PAGE VISUAL REDESIGN
**Duration:** 3-4 hours  
**Priority:** 🎨 MEDIUM - First impression matters  
**Issues Addressed:** #11

### 6.1 Redesign LoginPage

**File:** `apps/web/src/pages/LoginPage.jsx`

Replace the entire LoginPage with enhanced version:

```jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Loader2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form.jsx';
import { Input } from '@/components/ui/input.jsx';

// System branding constants
const SYSTEM_NAME = 'IT Helpdesk';
const SYSTEM_TAGLINE = 'Sistem Dukungan IT Terintegrasi';
const SYSTEM_DESCRIPTION = 'Kelola tiket support dengan efisien dan transparan';

export default function LoginPage() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const form = useForm({
    defaultValues: {
      identifier: '',
      password: '',
    },
  });
  const {
    formState: { isSubmitting },
    setError,
  } = form;

  const onSubmit = async (values) => {
    if (!values.identifier || !values.password) {
      const message = t('login.error_wrong_credentials', 'Email/Username dan password wajib diisi.');
      setError('identifier', { type: 'manual', message });
      setError('password', { type: 'manual', message });
      return;
    }

    try {
      await login(values.identifier, values.password);
      toast.success('Login berhasil');
    } catch (err) {
      const message = err.message || t('login.error_wrong_credentials', 'Terjadi kesalahan saat login.');
      setError('identifier', { type: 'manual', message });
      setError('password', { type: 'manual', message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4 py-8">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-start px-8 py-12">
        <div className="max-w-md space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg ring-4 ring-primary/10">
              <Lock className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {SYSTEM_NAME}
            </h1>
            <p className="text-xl font-semibold text-primary">
              {SYSTEM_TAGLINE}
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              {SYSTEM_DESCRIPTION}
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20">
                <span className="text-xs font-bold text-green-600">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Manajemen Tiket Terpusat</h3>
                <p className="text-sm text-muted-foreground">Kelola semua tiket support dari satu dashboard</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                <span className="text-xs font-bold text-blue-600">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Chat Real-time</h3>
                <p className="text-sm text-muted-foreground">Komunikasi instant dengan teknisi support</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                <span className="text-xs font-bold text-amber-600">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Analytics & Laporan</h3>
                <p className="text-sm text-muted-foreground">Pantau performa support dengan dashboard analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Mobile branding */}
        <div className="mb-6 flex flex-col items-center gap-3 lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg ring-4 ring-primary/10">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">{SYSTEM_NAME}</h1>
            <p className="text-sm text-muted-foreground mt-1">{SYSTEM_TAGLINE}</p>
          </div>
        </div>

        <Card className="border bg-card/95 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-4 text-center space-y-2">
            <CardTitle className="text-2xl">Masuk ke Akun</CardTitle>
            <CardDescription className="text-sm">
              Gunakan email atau username untuk masuk ke sistem
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email atau Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="admin@example.com atau admin"
                            disabled={isSubmitting}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium">Password</FormLabel>
                        <Link
                          to="/forgot-password"
                          className="text-xs text-primary hover:underline"
                        >
                          Lupa password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Masukkan password Anda"
                            disabled={isSubmitting}
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            disabled={isSubmitting}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pb-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sedang masuk...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Belum punya akun? </span>
                  <Link to="/signup" className="font-semibold text-primary hover:underline">
                    Daftar di sini
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
          <p>© 2026 {SYSTEM_NAME}. All rights reserved.</p>
          <p>Untuk bantuan, hubungi: support@example.com</p>
        </div>
      </div>
    </div>
  );
}
```

---

### 6.2 Phase 6 Testing Checklist
```
Login Page:
- [ ] Two-column layout shows on desktop
- [ ] Mobile layout single column responsive
- [ ] Logo/icon displays correctly
- [ ] System branding prominent
- [ ] Form fields have icons
- [ ] "Forgot password" link works
- [ ] "Sign up" link works
- [ ] Submit button shows loading state
- [ ] Error messages display correctly
- [ ] "Forgot password" section not blank - shows helpful message
```

---

## ⏱️ PHASE 7: UI CONSISTENCY & STANDARDIZATION
**Duration:** 3-4 hours  
**Priority:** 🎨 MEDIUM - Code quality & consistency  
**Issues Addressed:** #14, #15

### 7.1 Standardize Page Headers

**Create guidelines file:** `apps/web/docs/COMPONENT_GUIDELINES.md`

```markdown
# Component Usage Guidelines

## Page Headers

### Standardized Pattern: Use SectionHeader everywhere

All pages should use `<SectionHeader>` component instead of raw `<h1>` or `<Card>` headers.

**Correct Usage:**
```jsx
import SectionHeader from '@/components/SectionHeader.jsx';

export default function MyPage() {
  return (
    <div>
      <SectionHeader
        title="Page Title"
        subtitle="Optional subtitle or context"
        actions={<Button>Action</Button>}
      />
      {/* Page content */}
    </div>
  );
}
```

**Do NOT use:**
- Raw `<h1>` tags
- `<Card><CardHeader><CardTitle>` for page header
- Inline header styles
```

**Audit all pages and update:**
1. Find all pages with non-standard headers
2. Replace with SectionHeader component
3. Test each page still renders correctly

**Pages to check:**
- [ ] LoginPage.jsx
- [ ] SignupPage.jsx
- [ ] HomePage.jsx
- [ ] All Dashboard pages
- [ ] All Settings pages
- [ ] All Admin pages
- [ ] All Technician pages

---

### 7.2 Standardize Empty States

**Create Empty State Component Enhancement**

If not already comprehensive, enhance `src/components/ui/empty.jsx`:

```jsx
import React from 'react';
import { AlertCircle, FileText, Wifi, Lock } from 'lucide-react';

export const EMPTY_STATE_VARIANTS = {
  NO_RESULTS: 'no-results',
  NO_PERMISSIONS: 'no-permissions',
  OFFLINE: 'offline',
  ERROR: 'error',
};

export function Empty({ 
  variant = EMPTY_STATE_VARIANTS.NO_RESULTS,
  title,
  description,
  action,
  children 
}) {
  const iconMap = {
    [EMPTY_STATE_VARIANTS.NO_RESULTS]: FileText,
    [EMPTY_STATE_VARIANTS.NO_PERMISSIONS]: Lock,
    [EMPTY_STATE_VARIANTS.OFFLINE]: Wifi,
    [EMPTY_STATE_VARIANTS.ERROR]: AlertCircle,
  };

  const Icon = iconMap[variant] || FileText;
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title || 'Tidak Ada Data'}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
        {description || 'Tidak ada data untuk ditampilkan saat ini'}
      </p>
      {action && <div className="mb-2">{action}</div>}
      {children}
    </div>
  );
}
```

**Update all pages to use standardized pattern:**

Before:
```jsx
{tickets.length === 0 ? (
  <div className="text-center py-8">
    <p className="text-muted-foreground">Tidak ada tiket</p>
  </div>
) : (
  // ...
)}
```

After:
```jsx
{tickets.length === 0 ? (
  <Empty 
    title="Belum Ada Tiket"
    description="Anda belum membuat tiket support. Mulai dengan membuat tiket baru."
    action={<Button>Buat Tiket Baru</Button>}
  />
) : (
  // ...
)}
```

---

### 7.3 Phase 7 Testing Checklist
```
Consistency:
- [ ] All page headers use SectionHeader
- [ ] No raw <h1> tags in pages
- [ ] All empty states use Empty component
- [ ] Consistent empty state messaging
- [ ] Icons consistent across empty states
- [ ] Visual hierarchy consistent
```

---

## ⏱️ PHASE 8: MOBILE & POLISH
**Duration:** 3-4 hours  
**Priority:** 🎨 MEDIUM - Mobile UX & final polish  
**Issues Addressed:** #16, #17

### 8.1 Add Horizontal Scroll for Tables (Mobile)

**Pattern to apply to all tables:**

Before:
```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
      {/* ... many columns ... */}
    </TableRow>
  </TableHeader>
  <TableBody>
    {/* ... */}
  </TableBody>
</Table>
```

After:
```jsx
<div className="overflow-x-auto rounded-lg border">
  <Table className="min-w-full">
    <TableHeader>
      <TableRow>
        <TableHead>Column 1</TableHead>
        <TableHead>Column 2</TableHead>
        {/* ... many columns ... */}
      </TableRow>
    </TableHeader>
    <TableBody>
      {/* ... */}
    </TableBody>
  </Table>
</div>
```

**Files to update:**
- [ ] `AllTickets.jsx`
- [ ] `TicketHistory.jsx`
- [ ] `AdminDashboard.jsx` (tickets table)
- [ ] Any other pages with tables

**Testing:**
- [ ] Mobile: Can swipe/scroll table horizontally
- [ ] Desktop: Normal table display
- [ ] Responsive: Table scrollbar visible on small screens

---

### 8.2 Enhance Chat UI

**Enhanced Chat Bubble Component**

Create or update: `apps/web/src/components/ChatMessage.jsx`

```jsx
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar.jsx';
import { format } from 'date-fns';
import { CheckCheck, Check } from 'lucide-react';

export function ChatMessage({ 
  message, 
  isSent = false, 
  senderName, 
  senderAvatar,
  timestamp,
  isRead = false 
}) {
  return (
    <div className={`flex gap-3 mb-4 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
        <AvatarImage src={senderAvatar} alt={senderName} />
        <AvatarFallback className="text-xs">
          {senderName?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>

      {/* Message bubble */}
      <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isSent 
            ? 'bg-primary text-primary-foreground rounded-br-none' 
            : 'bg-muted text-foreground rounded-bl-none'
        }`}>
          <p className="text-sm">{message}</p>
        </div>

        {/* Timestamp & Read Status */}
        <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground`}>
          {isSent && (
            isRead ? (
              <CheckCheck className="h-3 w-3 text-green-600" title="Telah dibaca" />
            ) : (
              <Check className="h-3 w-3" title="Terkirim" />
            )
          )}
          <span>{format(new Date(timestamp), 'HH:mm')}</span>
        </div>
      </div>
    </div>
  );
}
```

**Chat Container Usage:**

```jsx
import ChatMessage from '@/components/ChatMessage.jsx';

export function ChatContainer({ messages, currentUser }) {
  const [typingUser, setTypingUser] = React.useState(null);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full bg-background">
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg.content}
          isSent={msg.sender_id === currentUser.id}
          senderName={msg.sender_name}
          senderAvatar={msg.sender_avatar}
          timestamp={msg.created_at}
          isRead={msg.read_at !== null}
        />
      ))}

      {/* Typing indicator */}
      {typingUser && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="h-6 w-6">
            <AvatarFallback>{typingUser.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>sedang mengetik...</span>
        </div>
      )}
    </div>
  );
}
```

---

### 8.3 Phase 8 Testing Checklist
```
Mobile & Polish:
- [ ] Tables scrollable on mobile (<640px width)
- [ ] Chat bubbles styled with colors
- [ ] Sent messages on right, received on left
- [ ] Timestamps visible on chat messages
- [ ] Read status checkmarks show correctly
- [ ] Typing indicator animation works
- [ ] Avatar shows correctly in chat
- [ ] Responsive on all screen sizes (mobile, tablet, desktop)
```

---

---

# 📊 EXECUTION SUMMARY

## Phase Order (Recommended)
```
PHASE 1 (3-4h) ← BLOCKING - Must complete first
    ↓
PHASE 2 (4-5h) ← BLOCKING - Users see broken pages
    ↓
PHASE 3 (5-6h) ← Can work parallel with Phase 2
    ↓
PHASE 4 (2-3h) ← Cleanup, can defer if needed
    ↓
PHASE 5 (3-4h) ← Visual enhancements
    ↓
PHASE 6 (3-4h) ← UI redesign
    ↓
PHASE 7 (3-4h) ← Consistency fixes
    ↓
PHASE 8 (3-4h) ← Final polish
```

## Total Timeline
- **Fast Track (8 days):** Phases 1-2-3 only = 12-15 hours
- **Standard (14 days):** All phases = 25-30 hours
- **With QA/Testing:** Add 30-40% = 32-42 hours total

## Files Modified Summary
```
Frontend Changes:
- 18 component files
- 6 page files  
- 1 config file (vite.config.js)
- 1 package.json
- 1 components.json

Backend Changes:
- 2-3 endpoint modifications
- 1-2 new endpoints (tickets/summary)
- Database schema updates (optional)

Total: 30-35 files affected
```

---

# ✅ TESTING MASTER CHECKLIST

**Phase 1 - Security:**
- [ ] No DEBUG console.log in production
- [ ] Password change requires verification
- [ ] Ticket numbers server-generated and unique
- [ ] No sensitive data exposed

**Phase 2 - Critical UX:**
- [ ] HomePage redirects correctly
- [ ] 12 insight cards show real data
- [ ] No placeholder text visible
- [ ] Charts render properly

**Phase 3 - Logic:**
- [ ] /tickets/summary API works
- [ ] Dashboard loads faster
- [ ] Notification settings implemented or removed
- [ ] No data inconsistencies

**Phase 4 - Dependencies:**
- [ ] Build size reduced significantly
- [ ] No import errors
- [ ] npm install faster
- [ ] No runtime errors

**Phase 5 - Header/Sidebar:**
- [ ] Notification bell functional
- [ ] Unread count updates
- [ ] User avatar displays
- [ ] Sidebar branding updated

**Phase 6 - Login Page:**
- [ ] Desktop layout (2-column) shows
- [ ] Mobile layout responsive
- [ ] Professional appearance
- [ ] All links work

**Phase 7 - Consistency:**
- [ ] All headers use SectionHeader
- [ ] All empty states uniform
- [ ] No mixed patterns

**Phase 8 - Mobile & Polish:**
- [ ] Tables scrollable on mobile
- [ ] Chat UI enhanced
- [ ] Timestamps visible
- [ ] Read status shows

---

## 🎯 SUCCESS CRITERIA

✅ All phases completed when:
1. ✓ Zero security issues (no DEBUG logs, password verified, ticket numbers unique)
2. ✓ Zero broken pages (HomePage works, dashboards show real data)
3. ✓ Improved performance (APIs optimized, bundle reduced)
4. ✓ Professional appearance (login page branded, consistent UI)
5. ✓ Mobile responsive (all pages work on all screens)
6. ✓ Production ready (all issues resolved, tested, documented)

---

**Document prepared by:** AI Assistant  
**Last updated:** April 22, 2026  
**Status:** Ready for implementation
