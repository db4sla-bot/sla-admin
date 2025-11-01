# Access Control System Documentation

## Overview
The application now includes a comprehensive access control system that restricts user access to routes based on their permissions stored in the database.

## How It Works

### 1. User Access Permissions
- User access permissions are stored in the Firebase `Employees` collection
- Each user has an `access` array field containing their permitted modules (e.g., `['customers', 'leads', 'materials']`)
- If the `access` array is empty, the user has full admin access to all routes

### 2. Route Access Mapping
Routes are mapped to required permissions in `SLAData.jsx`:

```javascript
export const RouteAccessMapping = {
    '/': null,                    // Dashboard - accessible to all
    '/customers': 'customers',    // Requires 'customers' permission
    '/leads': 'leads',           // Requires 'leads' permission
    '/materials': 'materials',   // Requires 'materials' permission
    // ... etc
}
```

### 3. Access Control Component
The `AccessControlRoute` component:
- Wraps each route in the application
- Checks if the user has permission to access the current route
- Shows an "Access Denied" page if permission is not granted
- Automatically handles dynamic routes (e.g., `/customers/:customerid`)

### 4. Access Denied Page
When a user tries to access a restricted route:
- A professional "Access Denied" page is displayed
- Includes options to go back or return to dashboard
- Clear message explaining the access restriction

## Permission Categories

1. **customers** - Customer management (add, view, edit customers)
2. **leads** - Lead management (add, view, edit leads)  
3. **materials** - Material management (add, view, edit materials)
4. **timesheet** - Timesheet updates
5. **appointments** - Appointment management
6. **employees** - Employee management (admin only typically)
7. **payments** - Billing, invoices, quotations, payments
8. **investments** - Materials investment, asset investment, payroll
9. **applications** - Daily/monthly expenses, todo list, passwords, QR generator

## Usage Examples

### Admin User (Full Access)
```javascript
// In Firebase Employees collection
{
  email: "admin@company.com",
  access: [] // Empty array = full access
}
```

### Limited User (Specific Access)
```javascript
// In Firebase Employees collection  
{
  email: "user@company.com",
  access: ["customers", "leads"] // Only customers and leads access
}
```

## Testing
To test the access control:
1. Create a test user with limited permissions
2. Try accessing restricted routes
3. Verify the "Access Denied" page appears
4. Confirm accessible routes work normally

## Security Features
- **Safe by Default**: Unknown routes are denied access
- **Dynamic Route Support**: Handles parameterized routes like `/customers/:id`
- **Wildcard Support**: Supports route patterns like `/customers/*`
- **Real-time Updates**: Access changes when user permissions are updated in database