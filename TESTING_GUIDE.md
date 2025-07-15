# Role-Based System Testing Guide

## Prerequisites

1. **Add Role Column**: First, make sure you've added the role column to your database using one of these methods:

### Method 1: Supabase SQL Editor (Recommended)
```sql
ALTER TABLE public.profiles 
ADD COLUMN role TEXT DEFAULT 'player' 
CHECK (role IN ('admin', 'stadium_owner', 'player'));

UPDATE public.profiles 
SET role = 'player' 
WHERE role IS NULL;
```

### Method 2: Supabase Dashboard
- Go to Table Editor → profiles → Add Column
- Name: `role`, Type: `text`, Default: `'player'`
- Add constraint: `role IN ('admin', 'stadium_owner', 'player')`

## Testing Scenarios

### 🎮 **SCENARIO 1: Player Role (Default)**

#### Steps:
1. **Create New Account**
   ```
   Email: player@test.com
   Password: test123456
   Name: Test Player
   ```
2. **Expected Flow**:
   - Sign up → Role Selection Screen appears
   - Select "Player" role → Navigate to main app
   - See 4 tabs: Discover, Book Now, My Teams, Profile

#### Test Features:
- ✅ Browse stadiums on Home screen
- ✅ Book a stadium (BookingScreen)
- ✅ View booking history in Profile
- ❌ Should NOT see "Manage" or "Admin" tabs
- ❌ Should NOT access stadium management features

---

### 🏟️ **SCENARIO 2: Stadium Owner Role**

#### Steps:
1. **Create Stadium Owner Account**
   ```
   Email: owner@test.com
   Password: test123456
   Name: Stadium Owner
   ```
2. **Set Role**: 
   - Option A: During signup → Select "Stadium Owner"
   - Option B: Manually update in database:
   ```sql
   UPDATE profiles SET role = 'stadium_owner' WHERE id = 'user-id-here';
   ```
3. **Expected Flow**:
   - Login → Navigate to Stadium Management screen
   - See 5 tabs: Discover, Book Now, My Teams, Profile, **Manage**

#### Test Features:
- ✅ Access Stadium Management dashboard
- ✅ View booking statistics and revenue
- ✅ See "Overview", "Stadiums", "Bookings" tabs
- ✅ Confirm/cancel pending bookings
- ✅ Quick action buttons on dashboard bookings
- ✅ Access AllBookings screen with filtering
- ❌ Should NOT see "Admin" tab

#### Test Booking Management:
1. **Create a booking as a player** (use different account)
2. **As stadium owner**:
   - Go to Manage tab → Overview
   - See pending booking in recent bookings
   - Click confirm/cancel buttons
   - Verify booking status changes
   - Check AllBookings screen for filtering

---

### 👑 **SCENARIO 3: Admin Role**

#### Steps:
1. **Create Admin Account**
   ```
   Email: admin@test.com
   Password: test123456
   Name: System Admin
   ```
2. **Set Role Manually**:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'user-id-here';
   ```
3. **Expected Flow**:
   - Login → Navigate to Admin Dashboard
   - See 6 tabs: Discover, Book Now, My Teams, Profile, **Manage**, **Admin**

#### Test Features:
- ✅ Access Admin Dashboard
- ✅ View system-wide statistics
- ✅ See "Overview", "Users", "Stadiums", "Bookings" tabs
- ✅ Change user roles
- ✅ Activate/deactivate stadiums
- ✅ View all platform activity
- ✅ Access all stadium owner features

#### Test Admin Actions:
1. **User Management**:
   - Go to Admin tab → Users
   - Try changing a user's role
   - Verify role change takes effect
2. **Stadium Management**:
   - Go to Admin tab → Stadiums
   - Toggle stadium active/inactive status
   - Verify changes reflect in app
3. **System Monitoring**:
   - Check Overview tab for platform stats
   - View Recent Activity

---

### 🔒 **SCENARIO 4: Access Control Testing**

#### Test Role Guards:
1. **Try accessing restricted URLs directly** (if using web):
   - `/stadium-management` as player → Should show "Access Denied"
   - `/admin-dashboard` as player/owner → Should show "Access Denied"

2. **Test Navigation Restrictions**:
   - Player: Only see 4 tabs
   - Stadium Owner: See 5 tabs (no Admin)
   - Admin: See all 6 tabs

3. **Test API Permissions**:
   - Player trying to confirm bookings → Should fail
   - Stadium owner accessing other owner's bookings → Should fail
   - Only admin can change user roles

---

## Quick Test Database Setup

### Create Test Users Quickly:
```sql
-- Insert test player
INSERT INTO auth.users (id, email) VALUES 
('player-test-id', 'player@test.com');

INSERT INTO profiles (id, full_name, role) VALUES 
('player-test-id', 'Test Player', 'player');

-- Insert test stadium owner
INSERT INTO auth.users (id, email) VALUES 
('owner-test-id', 'owner@test.com');

INSERT INTO profiles (id, full_name, role) VALUES 
('owner-test-id', 'Stadium Owner', 'stadium_owner');

-- Insert test admin
INSERT INTO auth.users (id, email) VALUES 
('admin-test-id', 'admin@test.com');

INSERT INTO profiles (id, full_name, role) VALUES 
('admin-test-id', 'System Admin', 'admin');
```

### Create Test Stadium:
```sql
INSERT INTO stadiums (owner_id, name, city, price_per_hour, is_active) VALUES 
('owner-test-id', 'Test Stadium', 'Test City', 100, true);
```

### Create Test Booking:
```sql
INSERT INTO bookings (stadium_id, user_id, booking_date, start_time, end_time, total_price, status) VALUES 
('stadium-id-here', 'player-test-id', '2025-07-15', '16:00:00', '17:00:00', 100, 'pending');
```

---

## Testing Checklist

### ✅ Authentication Flow
- [ ] New user signup shows role selection
- [ ] Role selection updates user profile
- [ ] Login routes to correct interface based on role
- [ ] Role changes take effect immediately

### ✅ Player Features
- [ ] Can browse stadiums
- [ ] Can make bookings
- [ ] Can view own booking history
- [ ] Cannot access management features

### ✅ Stadium Owner Features
- [ ] Can access stadium management dashboard
- [ ] Can view own stadium bookings
- [ ] Can confirm/cancel bookings for own stadiums
- [ ] Can see revenue statistics
- [ ] Cannot access admin features
- [ ] Cannot manage other owners' stadiums

### ✅ Admin Features
- [ ] Can access admin dashboard
- [ ] Can view all system data
- [ ] Can change user roles
- [ ] Can manage all stadiums
- [ ] Can manage all bookings
- [ ] Can see platform-wide statistics

### ✅ Security & Access Control
- [ ] Role guards prevent unauthorized access
- [ ] API calls respect user permissions
- [ ] Navigation shows appropriate tabs only
- [ ] Error messages for access denied scenarios

---

## Common Issues & Solutions

### Issue: Role Selection not appearing
**Solution**: Check if user profile exists and role is null

### Issue: Navigation not updating after role change
**Solution**: Restart app or refresh auth context

### Issue: Access denied errors
**Solution**: Verify role column exists and has correct constraints

### Issue: Booking actions not working
**Solution**: Check stadium ownership and user roles match

---

## Demo Flow

1. **Start as Player**: Sign up → Browse stadiums → Make booking
2. **Switch to Owner**: Login as owner → See pending booking → Confirm it
3. **Switch to Admin**: Login as admin → View all users → Change someone's role

This comprehensive testing ensures your role-based system works perfectly! 🚀