# Computer Inventory System

INF 653 Final Project — Group 9

## Project Overview

We built a web-based **Computer Inventory System** for managing IT hardware and peripherals. The system supports the full lifecycle of assets, including:

- inventory item CRUD
- user management and roles
- login and authentication
- API key management
- check-in / check-out workflows
- asset history tracking
- reporting

The project includes both:

- **HBS-rendered web pages** for browser use
- **JSON API endpoints** for backend operations and testing

## Group Members

- KENG Ratanak Piseth
- HENG Bunkheang
- Thay Rothrithyvong

## What We Implemented

### Inventory Management
We implemented item CRUD through both the UI and API. Items include:

- Item ID
- Serial Number
- Model
- Brand
- Classification
- Category
- Status
- Date Acquired

### User Management and Roles
We implemented:

- user creation
- role assignment (`admin` and `technician`)
- role updates after creation
- enable / disable account status

### Authentication
We implemented:

- password hashing
- login through `/api/auth/login`
- JWT token issuance
- disabled users cannot log in

### API Key Management
We implemented:

- API key generation
- API key listing
- API key revocation

### Check-in / Check-out
We implemented:

- item check-out
- item check-in
- document upload support for both workflows

### Asset History
We implemented:

- item transaction history
- assignment history
- previous user tracking
- reference document links

### Reporting
We implemented:

- inventory summary
- asset aging report
- user audit reporting

## Technology Stack

We used:

- **Node.js**
- **Express.js**
- **Handlebars (HBS)**
- **Supabase / PostgreSQL**
- **JWT** for authentication
- **bcrypt / bcryptjs** for password hashing
- **multer** for file uploads
- **morgan** for request logging
- **express-rate-limit** for rate limiting

## Live Demo

You can test the deployed website here:

- **Live URL:** `https://computer-inventory-system-seven.vercel.app`

## Login Credentials for Testing

Use the following accounts to test the system on the deployed website.

### Admin Account
- **Email:** `admin@gmail.com`
- **Password:** `admin123`

### Technician Account
- **Email:** `lead.tech@cis.test`
- **Password:** `tech123`

### Disabled account for testing disabled login
- **Email:** `disabled.tech@cis.test`
- **Password:** `disabled123`

## Suggested Testing Flow

### Admin Testing
Log in as Admin and test:

- Create a new inventory item
- Edit an item
- Delete an item
- Create a new user
- Change a user role
- Enable or disable a user
- Generate and revoke API keys
- View reports
- Check item history

### Technician Testing
Log in as Technician and test:

- View inventory
- Perform check-out / check-in actions
- View item history

## API Endpoints

### Authentication
- `POST /api/auth/login`

### Users
- `POST /api/users`
- `PATCH /api/users/:id/role`
- `PATCH /api/users/:id/status`

### API Keys
- `POST /api/keys`
- `GET /api/keys`
- `DELETE /api/keys/:id`

### Items
- `GET /api/items`
- `GET /api/items/:id`
- `GET /api/items/:id/history`
- `POST /api/items`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`

### Transactions
- `POST /api/transactions/checkout`
- `POST /api/transactions/checkin`

## How to Run the Project

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root and configure the required environment variables.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open:

   ```text
   http://localhost:3000
   ```

## Project Structure

```text
Computer-Inventory-System/
├── public/
├── scripts/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
├── views/
│   ├── auth/
│   ├── items/
│   ├── users/
│   ├── keys/
│   ├── reports/
│   ├── transactions/
│   ├── layouts/
│   └── partials/
├── package.json
└── README.md
```

## Security Features

We implemented:

- JWT-protected API routes
- API key validation
- role-based access control (RBAC)
- password hashing
- rate limiting
- request logging
- soft delete for data integrity

## Notes

- Items in **Maintenance** or **Retired** status cannot be checked out.
- Disabled users cannot log in.
- Items and users are not hard-deleted in normal system use.

## Repository

- **GitHub Repository:** `https://github.com/Group9-Backend-Development/Computer-Inventory-System`

## License

This project was created by group 9 as our final year project for the course INF653 Backend Web Development
