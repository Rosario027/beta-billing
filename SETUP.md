# GST Ledger - Development Setup

## Option 1: Using Docker (Recommended for Local Development)

### Prerequisites
- Docker Desktop installed

### Steps:
1. Start PostgreSQL database:
   ```bash
   docker-compose up -d
   ```

2. Wait for database to be ready (about 10 seconds)

3. Push database schema:
   ```bash
   npm run db:push
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Stop database when done:
   ```bash
   docker-compose down
   ```

## Option 2: Using Cloud PostgreSQL (No Local Install)

### Free PostgreSQL Providers:
- **Neon** (https://neon.tech) - Free tier, instant setup
- **Supabase** (https://supabase.com) - Free tier
- **ElephantSQL** (https://www.elephantsql.com) - Free tier

### Steps:
1. Sign up for any of the above services
2. Create a new PostgreSQL database
3. Copy the connection string (looks like: `postgresql://user:pass@host:5432/db`)
4. Update `.env` file:
   ```env
   DATABASE_URL=your_connection_string_here
   ```
5. Push database schema:
   ```bash
   npm run db:push
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

## Option 3: Install PostgreSQL Locally

### Windows:
1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings (remember the password!)
3. PostgreSQL will run automatically
4. Update `.env` with your password:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/gst_ledger
   ```
5. Create database:
   ```bash
   psql -U postgres
   CREATE DATABASE gst_ledger;
   \q
   ```
6. Push schema:
   ```bash
   npm run db:push
   ```

## Verify Setup

After following any option above, test the connection:
```bash
npm run check
```

Then start the app:
```bash
npm run dev
```

Visit: http://localhost:5000

## Troubleshooting

**Connection refused error:**
- Make sure PostgreSQL is running
- Check the DATABASE_URL in `.env`
- Verify the port (default 5432) is not in use

**Authentication failed:**
- Check username/password in DATABASE_URL
- For Docker: default is `postgres/postgres`

**Database doesn't exist:**
- Create it manually using `psql` or pgAdmin
- Or use a cloud provider that auto-creates it
