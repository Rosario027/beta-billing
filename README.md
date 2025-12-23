# Beta Billing - GST Invoice Management System

A modern GST invoicing application for Chartered Accountants to manage multiple clients, customers, and invoices.

## Features

- 🏢 **Multi-Client Management**: Manage multiple client businesses from one account
- 👥 **Customer Database**: Track customers with GSTIN, contact details
- 📄 **GST Invoicing**: Create B2B and B2C invoices with automatic tax calculations
- 📊 **Dashboard**: Overview of invoices, revenue, and key metrics
- 🔐 **Authentication**: Secure user authentication system
- 💾 **PostgreSQL Database**: Robust data storage with Drizzle ORM

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: Vite
- **Routing**: Wouter
- **State Management**: Zustand, TanStack Query

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Rosario027/beta-billing.git
cd beta-billing
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file with:
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
```

4. Push database schema:
```bash
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Deployment to Railway

1. Create a new project on [Railway](https://railway.app)
2. Add PostgreSQL database to your project
3. Connect your GitHub repository
4. Set environment variables:
   - `DATABASE_URL` (auto-set by Railway PostgreSQL)
   - `SESSION_SECRET` (generate a secure random string)
   - `NODE_ENV=production`
5. Deploy!

Railway will automatically run the build and start commands from `package.json`.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema
- `npm run check` - TypeScript type checking

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   └── pages/       # Page components
├── server/              # Express backend
│   ├── auth/            # Authentication logic
│   ├── db.ts            # Database connection
│   ├── routes.ts        # API routes
│   └── storage.ts       # Data access layer
├── shared/              # Shared types and schemas
│   ├── models/          # Data models
│   ├── routes.ts        # API contract
│   └── schema.ts        # Database schema
└── script/              # Build scripts
```

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Customers
- `GET /api/clients/:clientId/customers` - List customers
- `POST /api/clients/:clientId/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Invoices
- `GET /api/clients/:clientId/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/clients/:clientId/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
