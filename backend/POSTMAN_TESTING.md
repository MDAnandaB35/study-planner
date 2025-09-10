# Postman Testing Guide for Supabase Auth Backend

## Setup

1. **Create a `.env` file** in the backend directory with:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

2. **Install dependencies and start server**:

```bash
npm install
npm run dev
```

## API Endpoints

### 1. Health Check

- **Method**: GET
- **URL**: `http://localhost:3001/`
- **Description**: Check if server is running and see available endpoints

### 2. User Registration

- **Method**: POST
- **URL**: `http://localhost:3001/auth/signup`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### 3. User Login

- **Method**: POST
- **URL**: `http://localhost:3001/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Note**: This will set an HTTP-only cookie for session management.

### 4. Get Current User (Cookie-based)

- **Method**: GET
- **URL**: `http://localhost:3001/auth/me`
- **Description**: Uses the cookie set during login

### 5. Get Current User (Header-based)

- **Method**: GET
- **URL**: `http://localhost:3001/profile`
- **Headers**: `Authorization: Bearer YOUR_ACCESS_TOKEN`
- **Description**: Uses Authorization header (get token from login response)

### 6. Logout

### 7. AI/Plans (existing)

- POST `/ai/complete`
- GET `/ai/plans`
- GET `/ai/plans/latest`
- GET `/ai/plans/:id`
- PUT `/ai/plans/:id`
- DELETE `/ai/plans/:id`
- GET `/ai/plans/public`
- GET `/ai/plans/public/:id`

### 8. Bookmarks & Progress (new)

- POST `/ai/public/plans/:id/bookmark`
- DELETE `/ai/public/plans/:id/bookmark`
- GET `/ai/bookmarks`
- GET `/ai/public/plans/:id/progress`
- POST `/ai/public/plans/:id/progress` with body `{ "milestone_id": string, "completed": boolean }`

- **Method**: POST
- **URL**: `http://localhost:3001/auth/logout`
- **Description**: Clears the authentication cookie

## Testing Flow

1. **Start the server**: `npm run dev`
2. **Test health check**: GET `http://localhost:3001/`
3. **Register a user**: POST to `/auth/signup`
4. **Login**: POST to `/auth/login` (save the access_token from response)
5. **Test protected route with cookie**: GET `/auth/me`
6. **Test protected route with header**: GET `/profile` with Authorization header
7. **Logout**: POST to `/auth/logout`

## Response Format

All responses follow this format:

```json
{
  "success": true/false,
  "message": "Success message",
  "error": "Error message (if any)",
  "data": { ... }
}
```

## Features

✅ **Hybrid Authentication**: Supports both cookie-based and header-based auth
✅ **Enhanced Error Handling**: Detailed error messages and proper HTTP status codes
✅ **Session Management**: HTTP-only cookies with proper security settings
✅ **Protected Routes**: Example protected route for testing
✅ **CORS Configuration**: Properly configured for frontend integration
✅ **Input Validation**: Validates required fields
