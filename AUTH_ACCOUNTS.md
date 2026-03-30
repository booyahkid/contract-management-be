# Authentication System - User Accounts

## Login Credentials

After running the user reset script, the following dummy accounts are available:

### Admin Account
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Name:** Administrator

### Staff Accounts
- **Email:** `jane@example.com`
- **Password:** `staff123`
- **Role:** `staff`
- **Name:** Jane Smith

- **Email:** `david@example.com`
- **Password:** `staff123`
- **Role:** `staff`
- **Name:** David Wilson

### Manager Account
- **Email:** `bob@example.com`
- **Password:** `manager123`
- **Role:** `manager`
- **Name:** Bob Manager

### Regular User Accounts
- **Email:** `john@example.com`
- **Password:** `user123`
- **Role:** `user`
- **Name:** John Doe

- **Email:** `alice@example.com`
- **Password:** `user123`
- **Role:** `user`
- **Name:** Alice Johnson

## Resetting User Data

To delete all existing users and create new dummy accounts, run:

```bash
cd /Users/bas/Developer/IGW/BE
node scripts/reset-users.js
```

## Testing Authentication

### Test Login (Admin)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Test Login (Regular User)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "user123"}'
```

## API Response Format

The login endpoint now returns both token and user data:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 4,
    "name": "Administrator",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

## Role-Based Access

- **admin**: Full access to all features
- **manager**: Management level access
- **staff**: Staff level access
- **user**: Basic user access

## Frontend Integration

The frontend authentication has been updated to properly handle the new response format with user data included.
