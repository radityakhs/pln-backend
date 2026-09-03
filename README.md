# PLN Profile Backend

Backend API for the PLN Profile website, built with Express.js and MySQL.

## Prerequisites

- Node.js >= 18
- MySQL >= 8.0 (or hosting MySQL like srv2262.hstgr.io)

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your MySQL credentials:
   ```env
   # For hosting MySQL (srv2262.hstgr.io)
   MYSQL_HOST=srv2262.hstgr.io
   MYSQL_USER=your_mysql_username
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=pln_profile
   MYSQL_PORT=3306
   PORT=3001
   ```

4. Create the MySQL database (if it doesn't exist):
   ```sql
   CREATE DATABASE pln_profile;
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

## Checking Database Tables

To verify that the database connection works and tables are created:

```bash
cd backend
npm run check-db
```

This script will:
- Test the MySQL connection
- Check if the `pln_profile` database exists
- List all tables and their record counts
- Verify that `events`, `gallery`, and `pillars` tables exist

Expected output:
```
✅ Connected to MySQL successfully!
✅ Database "pln_profile" exists

Tables in "pln_profile":
  ✅ events - 7 records
  ✅ gallery - 5 records
  ✅ pillars - 4 records

✅ Database check complete!
```

## API Endpoints

### Gallery
- `GET /api/gallery` - Get all gallery albums
- `GET /api/gallery/:id` - Get a single gallery album
- `POST /api/gallery` - Create a gallery album
- `PUT /api/gallery/:id` - Update a gallery album
- `DELETE /api/gallery/:id` - Delete a gallery album

### Pillars
- `GET /api/pillars` - Get all pillars
- `GET /api/pillars/:tabId` - Get a single pillar by tab_id
- `PUT /api/pillars/:tabId` - Update a pillar

### Events
- `GET /api/events` - Get all events (with optional `?status=` and `?pillar_id=` filters)
- `GET /api/events/upcoming` - Get upcoming events
- `GET /api/events/past` - Get past events
- `GET /api/events/:id` - Get a single event
- `POST /api/events` - Create an event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

### Upload
- `POST /api/upload` - Upload a single image
- `POST /api/upload/multiple` - Upload multiple images

### Health
- `GET /api/health` - Health check

## Event Auto-Archiving

Events are automatically moved from "upcoming" to "past" status when their `end_date` has passed. This check runs on every request to the `/api/events` endpoint.

## Admin Panel

The admin panel is accessible at `http://localhost:3000/admin/login` with default credentials:
- Username: `admin`
- Password: `pln4u2026`

Credentials can be changed via environment variables `VITE_ADMIN_USER` and `VITE_ADMIN_PASS` in the frontend `.env` file.
