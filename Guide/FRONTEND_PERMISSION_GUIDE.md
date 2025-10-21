Frontend Permission Handling - Security Guide

## The Problem: JWT Exposure

### What not to do

```javascript
// Storing permissions in JWT
const jwt = {
  userId: "123",
  role: "admin",
  permissions: ["users:delete", "assets:delete", ...] //JWT becomes huge + visible
}
```

### What we do

```javascript
// GOOD: Minimal JWT
const jwt = {
  userId: "123",
  userVersion: 5  // For invalidation only
}

// Permissions sent separately in response body
const response = {
  accessToken: "jwt...",
  user: {
    id: "123",
    username: "john",
    role: { id: "...", name: "Manager" },
    permissions: ["users:view", "assets:create", ...] // In response, not in JWT
  }
}
```

## Implementation

### Backend Changes (Already Done!)

1. **Login returns permissions**

```javascript
  POST /api/v1/auth/login
  Response:
  {
    "accessToken": "jwt...",
    "user": {
      "id": "...",
      "username": "...",
      "permissions": ["users:view", "assets:create", ...]  // ← from DB
    }
  }
```

2. **New `/me` endpoint**

```javascript
GET /api/v1/auth/me
Authorization: Bearer <token>
Response:
{
  "id": "...",
  "username": "...",
  "role": { "name": "Manager", "priority": 500 },
  "permissions": ["users:view", "assets:create", ...]  // ← Always fresh
}
```

#### Periodically Refresh Permissions

```javascript
// hooks/usePermissionSync.js
import { useEffect } from "react";
import useAuthStore from "../store/authStore";
import api from "../services/api";

export function usePermissionSync(intervalMs = 60000) {
  // Every 1 minute
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const syncPermissions = async () => {
      try {
        const { data } = await api.get("/api/v1/auth/me");
        setAuth({ user: data, accessToken });
      } catch (error) {
        console.error("Failed to sync permissions", error);
      }
    };

    const interval = setInterval(syncPermissions, intervalMs);
    return () => clearInterval(interval);
  }, [accessToken, intervalMs]);
}

// Usage in App.jsx
function App() {
  usePermissionSync(60000); // Sync every 60 seconds
  return <RouterProvider />;
}
```

## Complete Flow

### Login Flow

```
1. User submits credentials
   ↓
2. Backend validates + gets permissions from DB
   ↓
3. Backend returns:
   - accessToken (minimal JWT with userId, userVersion)
   - user object with permissions array
   ↓
4. Frontend stores:
   - accessToken → localStorage
   - user + permissions → memory (Zustand/Redux)
   ↓
5. Frontend renders UI based on permissions
```
