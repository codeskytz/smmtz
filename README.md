## SMMTZ - SMM Reseller Platform
<img src="https://i.ibb.co/tw9vp9y1/idea-removebg-preview.png" alt="smmtz logo" height="500" width="500" position="center">

<a href="https://codeskytz.site">@codeskytz</a>
<a href="https://smmtz.site">@smmtz</a>

---

### Setup Instructions

#### 1. Firebase Configuration
- Update `src/config/firebase.js` with your Firebase credentials
- Initialize Firebase Project at [console.firebase.google.com](https://console.firebase.google.com)

#### 2. Firestore Security Rules
To enable admin user management functionality, you must deploy the Firestore rules:

**Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the content from `firestore.rules`
5. Click **Publish**

**Current Rules Enable:**
- Users can read/write their own profile
- Admins can read and manage all users
- Admins can promote/demote users and suspend accounts
- Authentication required for campaigns and analytics

#### 3. Create First Admin User
1. Register a new account normally
2. Go to Firebase Console → Firestore → users collection
3. Find your user document
4. Add/update field: `role: "admin"`
5. Now you have admin access to `/admin-dashboard`

#### 4. Install Dependencies
```bash
npm install
```

#### 5. Run Development Server
```bash
npm start
```

---

### Features

#### Authentication
- Email/Password registration and login
- Google OAuth integration
- Password reset via email
- Protected routes with role-based access

#### User Dashboard
- SMM reseller interface
- Profile management
- Dark/Light theme toggle
- Animated UI components

#### Admin Dashboard
- **User Management**:
  - View all users with search and filters
  - Promote users to admin
  - Demote admins to users
  - Suspend/Unsuspend accounts
- Collapsible sidebar for navigation
- Admin panel sections (Orders, Services, Reports, Settings)

#### User Suspension
- Suspended users see warning message
- Must contact admin to restore access
- Admins can manage suspension status

---

### Tech Stack
- React 19.2.0
- Firebase 10.14.1
- React Router DOM 6.20.0
- CSS3 with CSS Variables for theming

---

### File Structure
```
src/
├── config/
│   └── firebase.js
├── context/
│   └── AuthContext.js
├── pages/
│   ├── Home.js
│   ├── Login.js
│   ├── Register.js
│   ├── Dashboard.js
│   ├── AdminDashboard.js
│   ├── UserManagement.js
│   ├── ForgotPassword.js
│   └── ResetPassword.js
├── styles/
│   ├── App.css
│   ├── Auth.css
│   ├── Dashboard.css
│   └── UserManagement.css
└── App.js
```

---

### Routes
- `/` - Home page
- `/login` - Login
- `/register` - Registration
- `/forgot-password` - Password recovery
- `/reset-password` - Reset password with token
- `/dashboard` - User dashboard (protected)
- `/admin-dashboard` - Admin panel (admin only)

---

### Environment Variables
Create a `.env` file with your Firebase config (or configure in `src/config/firebase.js`)
