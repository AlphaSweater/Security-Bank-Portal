# Routes and Endpoints Documentation

> **Source of Truth** for all client-side routes and server-side API endpoints, including authentication and role-based access control requirements.

---

## Table of Contents

- [Client-Side Routes](#client-side-routes)
- [Server-Side API Endpoints](#server-side-api-endpoints)
- [Role Definitions](#role-definitions)
- [Cloudflare Pages Edge Protection](#cloudflare-pages-edge-protection)

---

## Client-Side Routes

All client routes are defined in `client/src/routing/routes.jsx`.

| Path                       | Label                 | Private? | Allowed Roles          | Show Navbar? | Show Footer? | Show in Nav? | Notes                                          |
| -------------------------- | --------------------- | -------- | ---------------------- | ------------ | ------------ | ------------ | ---------------------------------------------- |
| `/`                        | Landing               | No       | -                      | No           | No           | No           | Public landing page                            |
| `/auth`                    | Auth                  | No       | -                      | No           | No           | No           | Login/Register page                            |
| `/auth/forgot-password`    | Forgot Password       | No       | -                      | No           | No           | No           | Password recovery                              |
| `/auth/reset-password`     | Reset Password        | No       | -                      | No           | No           | No           | Password reset with token                      |
| `/dashboard`               | Dashboard             | Yes      | Any authenticated user | Yes          | Yes          | Yes          | Role-based dashboard (Customer/Employee/Admin) |
| `/transaction`             | Transaction           | Yes      | Any authenticated user | Yes          | Yes          | No           | Create new transaction                         |
| `/transactions/pending`    | Pending Transactions  | Yes      | `employee`, `admin`    | Yes          | Yes          | No           | View pending transactions for review           |
| `/transactions/review/:id` | Transaction Review    | Yes      | `employee`, `admin`    | Yes          | Yes          | No           | Review specific transaction                    |
| `/transactions/history`    | Transaction History   | Yes      | `employee`, `admin`    | Yes          | Yes          | No           | View transaction history                       |
| `/transactions/approved`   | Approved Transactions | Yes      | `employee`, `admin`    | Yes          | Yes          | No           | View approved transactions                     |
| `/transactions/rejected`   | Rejected Transactions | Yes      | `employee`, `admin`    | Yes          | Yes          | No           | View rejected transactions                     |
| `/admin/employees`         | Manage Employees      | Yes      | `admin`                | Yes          | Yes          | Yes          | Create, edit, delete employees                 |
| `/unauthorized`            | Unauthorized          | No       | -                      | No           | No           | No           | Shown when user lacks required role            |

### Client-Side Authorization Flow

1. **Authentication Check**: `PrivateRoute` component (`client/src/routing/PrivateRoute.jsx`) calls `/api/auth/sessionCheck`
2. **Role-Based Access**: If route has `allowedRoles` metadata, user's role is verified against the list
3. **Redirect Behavior**:
   - Not authenticated → redirect to `/auth`
   - Authenticated but wrong role → redirect to `/unauthorized`

---

## Server-Side API Endpoints

### Authentication Endpoints

**Base Route**: `/api/auth` (`server/src/routes/authRoutes.js`)

| Method | Path                     | Auth Required? | Roles | Rate Limit                                      | Description                                    |
| ------ | ------------------------ | -------------- | ----- | ----------------------------------------------- | ---------------------------------------------- |
| GET    | `/api/auth/sessionCheck` | No             | -     | ExcessLimiter                                   | Check if user is authenticated and return role |
| POST   | `/api/auth/login`        | No             | -     | LoginLimiter, EmailTargetLimiter, ExcessLimiter | User login                                     |
| POST   | `/api/auth/register`     | No             | -     | AuthFlowLimiter, ExcessLimiter                  | New user registration                          |
| POST   | `/api/auth/logout`       | No             | -     | AuthFlowLimiter, ExcessLimiter                  | User logout                                    |

### Customer Endpoints

**Base Route**: `/api/customers` (`server/src/routes/customerRoutes.js`)

| Method | Path                              | Auth Required? | Roles      | Rate Limit                    | Description                                               |
| ------ | --------------------------------- | -------------- | ---------- | ----------------------------- | --------------------------------------------------------- |
| GET    | `/api/customers/dashboard`        | Yes            | `customer` | GeneralLimiter                | Get customer dashboard with recent transactions           |
| GET    | `/api/customers/transactions`     | Yes            | `customer` | GeneralLimiter                | Get customer's transactions with filtering/pagination     |
| GET    | `/api/customers/transactions/:id` | Yes            | `customer` | GeneralLimiter                | Get single transaction details (ownership verified)       |
| POST   | `/api/customers/transactions`     | Yes            | `customer` | GeneralLimiter, ExcessLimiter | Create new transaction                                    |
| GET    | `/api/customers/stats`            | Yes            | `customer` | GeneralLimiter                | Get customer transaction statistics (day/week/month/year) |

### Employee Endpoints

**Base Route**: `/api/employees` (`server/src/routes/employeeRoutes.js`)

| Method | Path                                     | Auth Required? | Roles               | Rate Limit                    | Description                                    |
| ------ | ---------------------------------------- | -------------- | ------------------- | ----------------------------- | ---------------------------------------------- |
| GET    | `/api/employees/dashboard`               | Yes            | `employee`, `admin` | GeneralLimiter                | Get employee dashboard with review queue stats |
| GET    | `/api/employees/review-queue`            | Yes            | `employee`, `admin` | GeneralLimiter                | Get pending transactions for review            |
| GET    | `/api/employees/transactions/:id`        | Yes            | `employee`, `admin` | GeneralLimiter                | Get single transaction details for review      |
| POST   | `/api/employees/transactions/:id/review` | Yes            | `employee`, `admin` | GeneralLimiter, ExcessLimiter | Review transaction (approve/reject)            |
| GET    | `/api/employees/reviewed-transactions`   | Yes            | `employee`, `admin` | GeneralLimiter                | Get reviewed transactions with filtering       |

### User Endpoints

**Base Route**: `/api/users` (`server/src/routes/userRoutes.js`)

| Method | Path            | Auth Required? | Roles                  | Rate Limit     | Description                |
| ------ | --------------- | -------------- | ---------------------- | -------------- | -------------------------- |
| GET    | `/api/users/me` | Yes            | Any authenticated user | GeneralLimiter | Get current user's profile |

### Admin Endpoints

**Base Route**: `/api/admin` (To be implemented - based on client routes)

| Method | Path                       | Auth Required? | Roles   | Rate Limit | Description             |
| ------ | -------------------------- | -------------- | ------- | ---------- | ----------------------- |
| GET    | `/api/admin/employees`     | Yes            | `admin` | TBD        | List all employees      |
| POST   | `/api/admin/employees`     | Yes            | `admin` | TBD        | Create new employee     |
| PUT    | `/api/admin/employees/:id` | Yes            | `admin` | TBD        | Update employee details |
| DELETE | `/api/admin/employees/:id` | Yes            | `admin` | TBD        | Delete employee         |

> **Note**: Admin endpoints for employee management need to be implemented on the server side.

---

## Role Definitions

### Available Roles

| Role       | Description   | Access Level                                                     |
| ---------- | ------------- | ---------------------------------------------------------------- |
| `customer` | Regular user  | Can create transactions, view own transactions                   |
| `employee` | Bank employee | Can review/approve/reject transactions, view transaction history |
| `admin`    | Administrator | Full access: employee permissions + manage employees             |

### Role Aliases (Server-Side)

The server uses role aliases defined in `server/src/middlewares/roleMiddleware.js`:

- `customer` → also accepts `user`
- `employee` → also accepts `staff`, `admin`

### Client-Side Role Handling

- **Dashboard**: Uses `role` prop to render different dashboards:
  - `customer` → `CustomerDashboard`
  - `employee` or `admin` → `EmployeeDashboard`
- **PrivateRoute**: Injects `role` prop into page components for conditional rendering

---

## Cloudflare Pages Edge Protection

**File**: `client/functions/[[path]].js`

This Cloudflare Pages Function provides server-side route protection before pages are served.

### Public Routes (No Auth Required)

- `/` (Landing)
- `/auth` (Login/Register)
- `/auth/forgot-password`
- `/auth/reset-password`
- `/about`
- `/privacy`
- `/unauthorized`

### Protected Routes with Role Requirements

| Route Pattern            | Allowed Roles                   |
| ------------------------ | ------------------------------- |
| `/dashboard`             | `customer`, `employee`, `admin` |
| `/transaction`           | `customer`, `admin`             |
| `/transactions/pending`  | `employee`, `admin`             |
| `/transactions/review`   | `employee`, `admin`             |
| `/transactions/history`  | `employee`, `admin`             |
| `/transactions/approved` | `employee`, `admin`             |
| `/transactions/rejected` | `employee`, `admin`             |

### Edge Protection Flow

1. Public routes and static assets → pass through
2. For protected routes:
   - Check for session cookie
   - Call `/api/auth/sessionCheck` to verify authentication
   - Parse user's role from response
   - Verify role against allowed roles for the route
   - Redirect to `/auth` if not authenticated
   - Redirect to `/unauthorized` if wrong role

---

## Security Notes

### Defense in Depth

The application implements **multiple layers** of access control:

1. **Cloudflare Edge** (`client/functions/[[path]].js`): First line of defense, prevents unauthorized page loads
2. **Client-Side Router** (`client/src/routing/PrivateRoute.jsx`): Verifies auth/role before rendering components
3. **Server-Side Middleware** (`server/src/middlewares/roleMiddleware.js`): **CRITICAL** - validates every API request

### Important Security Reminders

⚠️ **Client-side checks are NOT sufficient for security** - they improve UX but can be bypassed.

✅ **Server-side validation is mandatory** - every protected endpoint MUST validate authentication and roles.

✅ **Backend is the source of truth** - all authorization decisions must be enforced server-side.

---

## Rate Limiting

Rate limiters are defined in `server/src/config/rateLimitConfig.js`:

- **LoginLimiter**: Stricter limits on login attempts
- **AuthFlowLimiter**: General auth flow protection
- **EmailTargetLimiter**: Prevents email enumeration
- **GeneralLimiter**: Standard API rate limiting
- **ExcessLimiter**: Catch-all for abuse prevention

---

## Middleware Stack

### Authentication Middleware

**File**: `server/src/middlewares/authMiddleware.js`

- Checks if `req.session.userId` exists
- Returns 401 if not authenticated
- Used with `requireAuth`

### Role Middleware

**File**: `server/src/middlewares/roleMiddleware.js`

- Checks user's role(s) against allowed roles
- Supports role aliases (e.g., `user` → `customer`)
- Returns 403 if user lacks required role
- Used with `requireRole(...roles)`

### Validation Middleware

**File**: `server/src/middlewares/validationMiddleware.js`

- Validates request body/params against schemas
- Returns 400 on validation errors

---

## TODO / Future Improvements

- [ ] Implement server-side admin endpoints for employee management (`/api/admin/employees`)
- [ ] Add rate limiters to admin endpoints
- [ ] Consider adding audit logging for admin actions
- [x] ~~Add `/api/customers/transactions/:id` GET endpoint for fetching single transaction details~~ (Implemented)
- [ ] Document CSRF token flow and requirements
- [ ] Add session timeout documentation
- [ ] Consider implementing refresh token mechanism
- [ ] Add API versioning strategy (e.g., `/api/v1/...`)

---

## Change Log

| Date       | Author | Change                                                    |
| ---------- | ------ | --------------------------------------------------------- |
| 2025-11-07 | System | Updated with new customer and employee endpoint structure |
| 2025-11-06 | System | Initial documentation created from codebase analysis      |

---

**Last Updated**: November 7, 2025
