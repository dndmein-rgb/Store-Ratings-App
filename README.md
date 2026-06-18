# Store Ratings App

A web app where users can rate stores from 1 to 5. Built with Express, PostgreSQL, and React, with three roles: System Administrator, Normal User, and Store Owner, all sharing a single login.

**🚀 Production-ready for single-entity deployment on Render.com**


## Project structure

```
backend/         Express API serving frontend static files
frontend/        React app (Vite) - builds to backend/dist
render.yaml      Unified deployment configuration
package.json     Root orchestrator for builds
```

## Local Development

### Prerequisites
- Node.js 18.x
- PostgreSQL 12+
- npm 9+

### Backend setup

1. Make sure PostgreSQL is running and create a database:
   ```bash
   createdb store_ratings
   ```

2. Install root dependencies and backend:
   ```bash
   npm install
   npm install --prefix backend
   ```

3. Copy `.env.example` to `backend/.env` and fill in your database credentials:
   ```bash
   cp .env.example backend/.env
   ```

   Update `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/store_ratings
   JWT_SECRET=your-secret-key-at-least-32-characters-long-here
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

4. Run the schema against your database:
   ```bash
   psql -U postgres -d store_ratings -f backend/src/db/schema.sql
   ```

   This seeds a default admin account:
   - Email: `admin@storeratings.com`
   - Password: `Admin@1234`

5. Start the backend:
   ```bash
   npm start --prefix backend
   ```
   The API runs on `http://localhost:5000`

### Frontend setup

1. Install frontend dependencies:
   ```bash
   npm install --prefix frontend
   ```

2. Start the dev server:
   ```bash
   npm run dev --prefix frontend
   ```
   The app runs on `http://localhost:5173`

### Or run both together

```bash
npm run dev
```
(Requires `concurrently` installed - see `package.json`)

## How the roles work

There's one login page for everyone. After logging in, the role on the account decides what you see:

- **System Administrator** — dashboard with total users/stores/ratings, can add users (any role) and stores, can browse and filter the user and store lists, and can drill into any user's details.
- **Normal User** — can sign up themselves, browse and search stores, rate stores 1–5, change a rating already given, and update their password.
- **Store Owner** — created by an admin, logs in to see their store's average rating and the list of customers who rated it.

Admins are the only ones who can create Store Owner and Admin accounts — the public signup form always creates a Normal User.

## Notes on validation

- Name: 20–60 characters
- Address: up to 400 characters
- Password: 8–16 characters, at least one uppercase letter and one special character
- Email: standard email format

These are enforced on both the frontend (for instant feedback) and the backend (so the rules can't be bypassed).


## Deployment to Render

This app is configured for **single-entity deployment** on Render:
- One Node.js service runs both API and frontend
- One PostgreSQL database
- Minimal configuration
- Lower costs than separate services

### Quick Deploy:

1. **Prepare:** Push your code to GitHub
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push
   ```

2. **Deploy:** Go to [render.com](https://render.com)
   - Click **New +** → **Blueprint**
   - Paste your GitHub repo URL
   - Render auto-detects `render.yaml`

3. **Configure:** Set environment variables
   - `JWT_SECRET` = Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. **Initialize Database:** After deployment succeeds
   - Connect to PostgreSQL
   - Run `backend/src/db/schema.sql`

5. **Verify:** Test the deployment
   ```bash
   curl https://your-app.onrender.com/api/health
   ```

