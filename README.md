# Supabase Auth – Node + React (Cookie + Header Hybrid)

## Stack

- Backend: Express + Supabase JS v2, cookies, CORS
- Frontend: CRA (React), TailwindCSS, react-router-dom

## Backend

1. Copy `.env` from your Supabase project:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

2. Install & run

```
cd backend
npm install
npm run dev
```

3. Endpoints

- POST `/auth/signup` { email, password }
- POST `/auth/login` { email, password } → sets HttpOnly cookie + returns session
- GET `/auth/me` (cookie auth)
- GET `/profile` (Authorization: Bearer <token>)
- POST `/auth/logout`

A Postman collection and environment are included in `backend/`.

## Frontend

1. Optional `.env` in `frontend/`:

```
REACT_APP_API_URL=http://localhost:3001
```

2. Install & run

```
cd frontend
npm install
npm start
```

3. Pages

- `/` Login → redirects to `/dashboard` on success
- `/register` Register → redirects to `/`
- `/dashboard` Protected – fetches `/auth/me`, redirects to `/` if not authenticated

## TailwindCSS

Already configured:

- `tailwind.config.js` with `./src/**/*.{js,jsx,ts,tsx}`
- `src/index.css` includes `@tailwind base; @tailwind components; @tailwind utilities;`
- If needed, install PostCSS deps:

```
cd frontend
npm i -D postcss autoprefixer
```

## Notes

- CORS is set to allow cookies: update `FRONTEND_URL` if your frontend runs elsewhere.
- For production, set `secure: true` on cookies and serve over HTTPS.
